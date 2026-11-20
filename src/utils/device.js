// Zistí, či stránku otvoril telefón alebo tablet s dotykovou klávesnicou.
// Dynamika písania sa meria len na fyzickej klávesnici.
export function isTouchDevice() {
  if (typeof navigator === "undefined") return false;
  if (navigator.userAgentData?.mobile) return true;
  if (/Android|iPhone|iPad|iPod|Mobile|Tablet/i.test(navigator.userAgent)) return true;
  // iPadOS sa hlási ako Mac, ale má viacbodový dotyk.
  const coarse = window.matchMedia?.("(pointer: coarse) and (hover: none)").matches;
  return Boolean(coarse && navigator.maxTouchPoints > 1);
}
