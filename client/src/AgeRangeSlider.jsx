import { useState, useRef } from "react";

/**
 * Dual-handle age range slider for dashboard zoom.
 * Draggable handles (pointer events + pointer capture), click-to-snap, touch support.
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

	const handleStyle = {
		position: "absolute",
		top: 0,
		width: 14,
		height: 14,
		borderRadius: "50%",
		background: "#3b82f6",
		border: "2px solid #fff",
		cursor: "grab",
		zIndex: 2,
		transform: "translateX(-50%)",
		boxShadow: "0 1px 3px rgba(0,0,0,0.4)",
		transition: dragging ? "none" : "0.15s ease",
		touchAction: "none",
	};

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
					background: active || "#3b82f6",
					opacity: from === min && to === max ? 0.4 : 1,
					transition: dragging ? "none" : "0.15s ease",
				}} />
				{/* From handle */}
				<div
					style={{ ...handleStyle, left: `${pct(from)}%`, cursor: dragging === "from" ? "grabbing" : "grab" }}
					onPointerDown={startDrag("from")}
					onPointerMove={(e) => {
						if (dragging !== "from") return;
						didDrag.current = true;
						moveHandle("from", e.clientX);
					}}
					onPointerUp={endDrag}
					onPointerCancel={endDrag}
				/>
				{/* To handle */}
				<div
					style={{ ...handleStyle, left: `${pct(to)}%`, cursor: dragging === "to" ? "grabbing" : "grab" }}
					onPointerDown={startDrag("to")}
					onPointerMove={(e) => {
						if (dragging !== "to") return;
						didDrag.current = true;
						moveHandle("to", e.clientX);
					}}
					onPointerUp={endDrag}
					onPointerCancel={endDrag}
				/>
			</div>
			<span style={{ fontSize: 11, fontFamily: mono, fontWeight: 600, color: labelColor, minWidth: 24 }}>
				{to}
			</span>
		</div>
	);
}
