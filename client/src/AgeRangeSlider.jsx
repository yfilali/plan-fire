import { useState, useRef } from "react";

/**
 * Dual-handle age range slider for dashboard zoom.
 * Draggable handles (pointer events + pointer capture), click-to-snap, touch support.
 * Keyboard accessible (role="slider", arrow keys, Home/End) with visible focus ring.
 */
export function AgeRangeSlider({
	from,
	to,
	min,
	max,
	onChangeFrom,
	onChangeTo,
	bg,
	active,
	mono = "'JetBrains Mono', 'Fira Code', monospace",
	labelColor = "#e4e4e7",
}) {
	const range = max - min;
	const pct = (v) => ((v - min) / range) * 100;
	const containerRef = useRef(null);
	const didDrag = useRef(false);
	const [dragging, setDragging] = useState(null);
	const [focused, setFocused] = useState(null);

	const accent = active || "#3b82f6";

	const clamp = (v, lo, hi) => Math.max(lo, Math.min(v, hi));

	// Shared by click and drag paths: clamps x to the track and guards zero width.
	const valueFromClientX = (clientX) => {
		if (!containerRef.current) return null;
		const rect = containerRef.current.getBoundingClientRect();
		if (rect.width <= 0) return null;
		const x = clamp(clientX - rect.left, 0, rect.width);
		return Math.round(min + (x / rect.width) * range);
	};

	const moveHandle = (which, clientX) => {
		const val = valueFromClientX(clientX);
		if (val === null) return;
		if (which === "from") onChangeFrom(clamp(val, min, to - 1));
		else onChangeTo(clamp(val, from + 1, max));
	};

	const startDrag = (which) => (e) => {
		e.stopPropagation();
		e.currentTarget.setPointerCapture(e.pointerId);
		setDragging(which);
	};

	const endDrag = () => setDragging(null);

	// Keyboard path: same clamping as the pointer path.
	const keyHandle = (which) => (e) => {
		const cur = which === "from" ? from : to;
		const lo = which === "from" ? min : from + 1;
		const hi = which === "from" ? to - 1 : max;
		let val;
		switch (e.key) {
			case "ArrowLeft":
			case "ArrowDown":
				val = cur - 1;
				break;
			case "ArrowRight":
			case "ArrowUp":
				val = cur + 1;
				break;
			case "Home":
				val = lo;
				break;
			case "End":
				val = hi;
				break;
			default:
				return;
		}
		e.preventDefault();
		if (which === "from") onChangeFrom(clamp(val, min, to - 1));
		else onChangeTo(clamp(val, from + 1, max));
	};

	// Outer handle: invisible 28x28 hit target centered on the track (track center is at 8px).
	const hitStyle = (which) => ({
		position: "absolute",
		top: -6,
		width: 28,
		height: 28,
		background: "transparent",
		cursor: dragging === which ? "grabbing" : "grab",
		zIndex: 2,
		transform: dragging === which || focused === which ? "translateX(-50%) scale(1.15)" : "translateX(-50%)",
		transition: dragging ? "none" : "0.15s ease",
		touchAction: "none",
		outline: "none",
	});

	// Inner visual circle: 14x14, vertically centered on the 6px track at top 5.
	const dotStyle = (which) => ({
		position: "absolute",
		top: 7,
		left: 7,
		width: 14,
		height: 14,
		boxSizing: "border-box",
		borderRadius: "50%",
		background: accent,
		border: "2px solid #fff",
		boxShadow: dragging === which || focused === which
			? `0 1px 3px rgba(0,0,0,0.4), 0 0 0 3px ${accent}40`
			: "0 1px 3px rgba(0,0,0,0.4)",
		transition: dragging ? "none" : "0.15s ease",
		pointerEvents: "none",
	});

	return (
		<div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1 }}>
			<span style={{ fontSize: 11, fontFamily: mono, fontWeight: 600, color: labelColor, minWidth: 24, textAlign: "right" }}>
				{from}
			</span>
			<div
				ref={containerRef}
				style={{ position: "relative", flex: 1, height: 16, cursor: "pointer", touchAction: "none" }}
				onClick={(e) => {
					// A click can still fire on the container after a pointer-capture drag ends.
					if (didDrag.current) {
						didDrag.current = false;
						return;
					}
					const val = valueFromClientX(e.clientX);
					if (val === null) return;
					// Snap to nearest handle
					if (Math.abs(val - from) <= Math.abs(val - to)) {
						onChangeFrom(clamp(val, min, to - 1));
					} else {
						onChangeTo(clamp(val, from + 1, max));
					}
				}}
			>
				{/* Track background (full range) */}
				<div style={{ position: "absolute", top: 5, left: 0, right: 0, height: 6, borderRadius: 3, background: bg || "#2a2d3a" }} />
				{/* Active range highlight */}
				<div style={{
					position: "absolute",
					top: 5,
					left: `${pct(from)}%`,
					width: `${pct(to) - pct(from)}%`,
					height: 6,
					borderRadius: 3,
					background: accent,
					opacity: from === min && to === max ? 0.4 : 1,
					transition: dragging ? "none" : "0.15s ease",
				}} />
				{/* From handle */}
				<div
					role="slider"
					tabIndex={0}
					aria-label="View from age"
					aria-valuemin={min}
					aria-valuemax={to - 1}
					aria-valuenow={from}
					aria-orientation="horizontal"
					style={{ ...hitStyle("from"), left: `${pct(from)}%` }}
					onPointerDown={startDrag("from")}
					onPointerMove={(e) => {
						if (dragging !== "from") return;
						didDrag.current = true;
						moveHandle("from", e.clientX);
					}}
					onPointerUp={endDrag}
					onPointerCancel={endDrag}
					onKeyDown={keyHandle("from")}
					onFocus={() => setFocused("from")}
					onBlur={() => setFocused(null)}
				>
					<div style={dotStyle("from")} />
				</div>
				{/* To handle */}
				<div
					role="slider"
					tabIndex={0}
					aria-label="View to age"
					aria-valuemin={from + 1}
					aria-valuemax={max}
					aria-valuenow={to}
					aria-orientation="horizontal"
					style={{ ...hitStyle("to"), left: `${pct(to)}%` }}
					onPointerDown={startDrag("to")}
					onPointerMove={(e) => {
						if (dragging !== "to") return;
						didDrag.current = true;
						moveHandle("to", e.clientX);
					}}
					onPointerUp={endDrag}
					onPointerCancel={endDrag}
					onKeyDown={keyHandle("to")}
					onFocus={() => setFocused("to")}
					onBlur={() => setFocused(null)}
				>
					<div style={dotStyle("to")} />
				</div>
			</div>
			<span style={{ fontSize: 11, fontFamily: mono, fontWeight: 600, color: labelColor, minWidth: 24 }}>
				{to}
			</span>
		</div>
	);
}
