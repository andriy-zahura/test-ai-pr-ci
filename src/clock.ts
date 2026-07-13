export function formatClockTime(date: Date): string {
  const weekday = date.toLocaleDateString("en-GB", { weekday: "short" });
  const day = date.getDate();
  const month = date.toLocaleDateString("en-GB", { month: "short" });
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");
  return `${weekday} ${day} ${month} ${hours}:${minutes}:${seconds}`;
}

export function mountClock(container: HTMLElement = document.body): () => void {
  const el = document.createElement("time");
  el.className = "clock";
  el.setAttribute("aria-live", "off");

  const tick = (): void => {
    const now = new Date();
    el.textContent = formatClockTime(now);
    el.setAttribute("datetime", now.toISOString());
  };

  tick();
  const intervalId = window.setInterval(tick, 1000);
  container.appendChild(el);

  return () => {
    window.clearInterval(intervalId);
    el.remove();
  };
}
