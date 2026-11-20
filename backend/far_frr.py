"""Analýza FAR/FRR: ako dobre sa dá rytmus písania použiť na overenie identity.

Skript používa tie isté šablóny a príznaky ako server (main.py), ale nič nemení a nepíše
do databázy. Z testovacích pokusov (opakovania 11-15) vypočíta skóre vlastných a cudzích
porovnaní, vyberie prah na opakovaniach 11-13 (bod EER) a overí ho na opakovaniach 14-15,
ktoré sa pri výbere prahu nepoužili. Nakreslí dva grafy do priečinka `--out`.

Použitie (z priečinka backend, vo virtuálnom prostredí s matplotlib):
    python far_frr.py                       # veta, grafy do ../docs/figures
    python far_frr.py --mode word --out .   # slovo, grafy do aktuálneho priečinka
"""
import argparse
import json
import sys
from math import ceil, sqrt
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
import main  # noqa: E402  (šablóny, príznaky a načítanie databázy)

DEFAULT_THRESHOLD = 3.0  # prah, ktorý používa server pre "neznámy" pokus
CAL_REPS = (11, 12, 13)  # na týchto opakovaniach sa vyberá prah
TEST_REPS = (14, 15)  # na týchto sa prah overuje (pri výbere sa nepoužijú)
CURVE_MAX, CURVE_STEP = 6.0, 0.1


def collect_scores(mode):
    """(opakovanie, vlastné?, skóre) pre každý testovací pokus a každú šablónu.

    Skóre = štandardizovaná vzdialenosť / sqrt(počet príznakov), teda priemerná
    štandardizovaná odchýlka na jeden príznak (rovnaká veličina ako pravidlo "neznámy").
    """
    frame = main.events_dataframe(mode)
    templates = main.build_templates(frame, mode)
    scores = []
    for (actual, _session, rep), group in frame.groupby(["participant_id", "session_id", "rep"], sort=True):
        if int(rep) <= 10:
            continue
        try:
            vector = main.attempt_features(group.to_dict("records"), main.MODE_KEYS[mode])
        except ValueError:
            continue
        for participant, (mean, std) in templates.items():
            distance = sqrt(sum(((x - c) / s) ** 2 for x, c, s in zip(vector, mean, std)))
            scores.append((int(rep), participant == str(actual), distance / sqrt(len(vector))))
    return scores, len(templates)


def rates(genuine, impostor, threshold):
    """(FAR, FRR) ako podiely: pokus sa prijme, ak skóre <= prah."""
    far = sum(s <= threshold for s in impostor) / len(impostor) if impostor else 0.0
    frr = sum(s > threshold for s in genuine) / len(genuine) if genuine else 0.0
    return far, frr


def equal_error_point(genuine, impostor):
    """Prah, pri ktorom sú FAR a FRR najbližšie, a EER (podiel) v tomto bode."""
    best = None
    for threshold in sorted(set(genuine) | set(impostor)):
        far, frr = rates(genuine, impostor, threshold)
        key = (abs(far - frr), max(far, frr), threshold)
        if best is None or key < best[0]:
            best = (key, threshold, (far + frr) / 2)
    return ceil(best[1] * 100) / 100, best[2]  # prah sa zaokrúhli nahor na 2 desatinné miesta


def split(scores, reps):
    genuine = [s for rep, ok, s in scores if rep in reps and ok]
    impostor = [s for rep, ok, s in scores if rep in reps and not ok]
    return genuine, impostor


def analyse(mode):
    scores, n_templates = collect_scores(mode)
    gen_cal, imp_cal = split(scores, CAL_REPS)
    gen_test, imp_test = split(scores, TEST_REPS)
    if len(gen_cal) < 5 or len(imp_cal) < 5:
        raise SystemExit(f"Málo dát na kalibráciu v režime '{mode}' (vlastné {len(gen_cal)}, cudzie {len(imp_cal)}).")
    threshold, eer = equal_error_point(gen_cal, imp_cal)
    far_t, frr_t = rates(gen_test, imp_test, threshold)
    far_d, frr_d = rates(gen_test, imp_test, DEFAULT_THRESHOLD)
    return {
        "mode": mode, "participants": n_templates,
        "calibration": {"reps": [min(CAL_REPS), max(CAL_REPS)], "genuine": len(gen_cal), "impostor": len(imp_cal)},
        "test": {"reps": [min(TEST_REPS), max(TEST_REPS)], "genuine": len(gen_test), "impostor": len(imp_test)},
        "threshold": threshold, "eer_percent": round(eer * 100, 1),
        "test_at_threshold": {"far": round(far_t * 100, 1), "frr": round(frr_t * 100, 1)},
        "test_at_default": {"far": round(far_d * 100, 1), "frr": round(frr_d * 100, 1)},
    }, (gen_cal, imp_cal, gen_test, imp_test)


def draw(mode, result, data, out):
    import matplotlib
    matplotlib.use("Agg")
    import matplotlib.pyplot as plt
    import numpy as np

    gen_cal, imp_cal, gen_test, imp_test = data
    threshold = result["threshold"]
    label = main.MODE_LABELS[mode].lower()
    grid = [round(i * CURVE_STEP, 2) for i in range(int(CURVE_MAX / CURVE_STEP) + 1)]
    far = [rates(gen_cal, imp_cal, t)[0] * 100 for t in grid]
    frr = [rates(gen_cal, imp_cal, t)[1] * 100 for t in grid]
    orange, gold, green, grey = "#ff754d", "#c9962b", "#3f9f78", "#777777"

    # 1) krivky FAR a FRR podľa prahu
    fig, ax = plt.subplots(figsize=(7, 4.2), dpi=150)
    ax.plot(grid, far, color=orange, linewidth=2.2, label="FAR: cudzí prijatý")
    ax.plot(grid, frr, color=gold, linewidth=2.2, label="FRR: vlastný odmietnutý")
    ax.axvline(threshold, color=green, linewidth=1.8, label=f"kalibrovaný prah {threshold:.2f}".replace(".", ","))
    ax.axvline(DEFAULT_THRESHOLD, color=grey, linewidth=1.4, linestyle="--", label="pôvodný prah 3")
    ax.set_xlim(0, CURVE_MAX)
    ax.set_ylim(0, 102)
    ax.set_xlabel("prah (priemerná štandardizovaná odchýlka na príznak)")
    ax.set_ylabel("chyba (%)")
    ax.grid(color="#dddddd", linewidth=0.6)
    ax.set_axisbelow(True)
    for side in ("top", "right"):
        ax.spines[side].set_visible(False)
    ax.legend(frameon=False, loc="center right", fontsize=8.5)
    fig.suptitle(f"Chyby overenia podľa prahu ({label})", fontsize=12, fontweight="bold")
    cal = result["calibration"]
    ax.set_title(f"kalibrácia na pokusoch {cal['reps'][0]}-{cal['reps'][1]}: {cal['genuine']} vlastných a "
                 f"{cal['impostor']} cudzích porovnaní, EER {result['eer_percent']:.1f} %".replace(".", ","),
                 fontsize=8.5, color="#666666")
    fig.tight_layout()
    fig.savefig(out / f"far_frr_{mode}.png")
    plt.close(fig)

    # 2) rozdelenie skóre vlastných a cudzích porovnaní (všetky testovacie pokusy 11-15)
    genuine = np.array(gen_cal + gen_test)
    impostor = np.array(imp_cal + imp_test)
    cap = 8.0
    bins = np.arange(0, cap + 0.25, 0.25)
    fig, ax = plt.subplots(figsize=(7, 4.2), dpi=150)
    ax.hist(np.clip(impostor, 0, cap - 1e-6), bins=bins, color=orange, alpha=0.75, label="cudzie porovnania")
    ax.hist(np.clip(genuine, 0, cap - 1e-6), bins=bins, color=green, alpha=0.75, label="vlastné porovnania")
    ax.axvline(threshold, color="#222222", linewidth=1.6, label=f"kalibrovaný prah {threshold:.2f}".replace(".", ","))
    ax.set_xlim(0, cap)
    ax.set_xlabel("skóre (hodnoty nad 8 sú v poslednom stĺpci)")
    ax.set_ylabel("počet porovnaní")
    for side in ("top", "right"):
        ax.spines[side].set_visible(False)
    ax.legend(frameon=False, fontsize=8.5)
    fig.suptitle(f"Skóre vlastných a cudzích porovnaní ({label})", fontsize=12, fontweight="bold")
    fig.tight_layout()
    fig.savefig(out / f"score_distribution_{mode}.png")
    plt.close(fig)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--mode", choices=sorted(main.MODE_KEYS), default="phrase")
    parser.add_argument("--out", default=str(Path(__file__).parent.parent / "docs" / "figures"))
    args = parser.parse_args()
    out_dir = Path(args.out)
    out_dir.mkdir(parents=True, exist_ok=True)
    summary, scores = analyse(args.mode)
    draw(args.mode, summary, scores, out_dir)
    print(json.dumps(summary, ensure_ascii=False, indent=2))
    print(f"Grafy: {out_dir / ('far_frr_' + args.mode + '.png')}, {out_dir / ('score_distribution_' + args.mode + '.png')}")
