/**
 * Horizontal drag-aware marquee for the skills showcase.
 *
 * Design notes:
 *  - Content is duplicated 4x in markup; one "cycle" = scrollWidth / 4,
 *    and we wrap the transform offset to stay seamless.
 *  - A single shared rAF loop drives every row (one loop per page, not per row).
 *  - Drags suppress the subsequent click so users don't navigate when panning.
 */

interface RowState {
    row: HTMLElement;
    track: HTMLElement;
    dir: 1 | -1;
    speed: number;
    cycle: number;
    offset: number;
    hovering: boolean;
    dragging: boolean;
    pointerDown: boolean;
    pointerId: number | null;
    lastX: number;
    lastT: number;
    dragDist: number;
}

const DRAG_THRESHOLD = 5;

function wrap(v: number, cycle: number): number {
    if (cycle <= 0) return v;
    while (v <= -cycle) v += cycle;
    while (v > 0) v -= cycle;
    return v;
}

function apply(state: RowState) {
    state.track.style.transform = `translate3d(${state.offset}px, 0, 0)`;
}

function openInBackgroundTab(href: string) {
    const isMac = navigator.platform.toUpperCase().includes("MAC");
    const synthetic = new MouseEvent("click", {
        bubbles: false,
        cancelable: true,
        view: window,
        ctrlKey: !isMac,
        metaKey: isMac,
    });
    const temp = document.createElement("a");
    temp.href = href;
    temp.target = "_blank";
    temp.rel = "noopener noreferrer";
    temp.dispatchEvent(synthetic);
}

function initRow(row: HTMLElement, speed: number): RowState | null {
    const track = row.querySelector<HTMLElement>(".skills-track");
    if (!track) return null;

    const dir: 1 | -1 = row.getAttribute("data-direction") === "right" ? 1 : -1;
    const cycle = track.scrollWidth / 4;

    const state: RowState = {
        row,
        track,
        dir,
        speed,
        cycle,
        offset: dir === 1 ? -cycle : 0,
        hovering: false,
        dragging: false,
        pointerDown: false,
        pointerId: null,
        lastX: 0,
        lastT: 0,
        dragDist: 0,
    };

    apply(state);

    row.addEventListener("pointerenter", () => { state.hovering = true; });
    row.addEventListener("pointerleave", () => { state.hovering = false; });

    row.addEventListener("pointerdown", (e) => {
        if (e.pointerType === "mouse" && e.button !== 0) return;
        state.pointerDown = true;
        state.dragging = false;
        state.pointerId = e.pointerId;
        state.lastX = e.clientX;
        state.lastT = performance.now();
        state.dragDist = 0;
    });

    row.addEventListener("pointermove", (e) => {
        if (!state.pointerDown || e.pointerId !== state.pointerId) return;
        const dx = e.clientX - state.lastX;
        state.lastX = e.clientX;
        state.lastT = performance.now();
        state.dragDist += Math.abs(dx);
        if (!state.dragging && state.dragDist > DRAG_THRESHOLD) {
            state.dragging = true;
            try { row.setPointerCapture(e.pointerId); } catch { /* noop */ }
            row.classList.add("is-dragging");
        }
        if (!state.dragging) return;
        state.offset = wrap(state.offset + dx, state.cycle);
        apply(state);
    });

    const endDrag = (e?: PointerEvent) => {
        if (!state.pointerDown || (e && e.pointerId !== state.pointerId)) return;
        state.pointerDown = false;
        const wasDragging = state.dragging;
        state.dragging = false;
        if (wasDragging && state.pointerId !== null) {
            try { row.releasePointerCapture(state.pointerId); } catch { /* noop */ }
        }
        state.pointerId = null;
        row.classList.remove("is-dragging");
    };
    row.addEventListener("pointerup", endDrag);
    row.addEventListener("pointercancel", endDrag);

    row.addEventListener(
        "click",
        (e) => {
            const wasDrag = state.dragDist > DRAG_THRESHOLD;
            state.dragDist = 0;
            if (wasDrag) {
                e.preventDefault();
                e.stopPropagation();
                return;
            }
            const target = e.target instanceof Element ? e.target.closest("a.skill-card") : null;
            if (!target) return;
            if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || (e as MouseEvent).button !== 0) return;
            e.preventDefault();
            e.stopPropagation();
            const href = target.getAttribute("href");
            if (!href || href === "#") return;
            openInBackgroundTab(href);
        },
        true,
    );

    return state;
}

export function initSkillsMarquee(speed: number) {
    const rows = Array.from(document.querySelectorAll<HTMLElement>(".skills-row"));
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const states = rows.map((r) => initRow(r, speed)).filter((s): s is RowState => s !== null);
    if (states.length === 0) return;

    const remeasure = () => {
        for (const s of states) s.cycle = s.track.scrollWidth / 4;
    };
    window.addEventListener("resize", remeasure);

    let lastFrame = performance.now();
    const tick = (now: number) => {
        const dt = Math.min(0.1, (now - lastFrame) / 1000);
        lastFrame = now;
        if (!prefersReduced) {
            for (const s of states) {
                if (s.dragging || s.hovering) continue;
                s.offset = wrap(s.offset + s.dir * s.speed * dt, s.cycle);
                apply(s);
            }
        }
        requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
}
