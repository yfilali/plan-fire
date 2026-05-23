import { useState, useRef, useEffect } from "react";

/**
 * Dual-handle age range slider for dashboard zoom.
 * Draggable handles, click-to-snap, touch support.
 */
export function AgeRangeSlider({ from, to, min, max, onChangeFrom, onChangeTo, bg, active }) {
	const range = max - min;
	const pct = (v) => ((v - min) / range) * 100;
	const containerRef = useRef(null);
	const [dragging, setDragging] = useState(null);

	useEffect(() => {
		if (!dragging) return;
		const onMove = (clientX) => {
			if (!containerRef.current) return;
			const rect = containerRef.current.getBoundingClientRect();
			const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
			const val = Math.round(min + (x / rect.width) * range);
			if (dragging === "from") onChangeFrom(Math.min(val, to - 1));
			else onChangeTo(Math.max(val, from + 1));
		};
		const onMouse = (e) => onMove(e.clientX);
		const onTouch = (e) => onMove(e.touches[0].clientX);
		const onUp = () => setDragging(null);
		window.addEventListener("mousemove", onMouse);
		window.addEventListener("mouseup", onUp);
		window.addEventListener("touchmove", onTouch);
		window.addEventListener("touchend", onUp);
		return () => {
			window.removeEventListener("mousemove", onMouse);
			window.removeEventListener("mouseup", onUp);
			window.removeEventListener("touchmove", onTouch);
			window.removeEventListener("touchend", onUp);
		};
	}, [dragging, from, to, min, range, onChangeFrom, onChangeTo]);

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
	};

	return (
		<div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1 }}>
			<span style={{ fontSize: 11, fontFamily: "'JetBrains Mono', 'Fira Code', monospace", fontWeight: 600, color: "#e4e4e7", minWidth: 24, textAlign: "right" }}>
				{from}
			</span>
			<div
				ref={containerRef}
				style={{ position: "relative", flex: 1, height: 16, cursor: "pointer" }}
				onClick={(e) => {
					if (!containerRef.current) return;
					const rect = containerRef.current.getBoundingClientRect();
					const x = e.clientX - rect.left;
					const val = Math.round(min + (x / rect.width) * range);
					// Snap to nearest handle
					if (Math.abs(val - from) <= Math.abs(val - to)) {
						onChangeFrom(Math.min(val, to - 1));
					} else {
						onChangeTo(Math.max(val, from + 1));
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
					onMouseDown={(e) => { e.stopPropagation(); setDragging("from"); }}
					onTouchStart={(e) => { e.stopPropagation(); setDragging("from"); }}
				/>
				{/* To handle */}
				<div
					style={{ ...handleStyle, left: `${pct(to)}%`, cursor: dragging === "to" ? "grabbing" : "grab" }}
					onMouseDown={(e) => { e.stopPropagation(); setDragging("to"); }}
					onTouchStart={(e) => { e.stopPropagation(); setDragging("to"); }}
				/>
			</div>
			<span style={{ fontSize: 11, fontFamily: "'JetBrains Mono', 'Fira Code', monospace", fontWeight: 600, color: "#e4e4e7", minWidth: 24 }}>
				{to}
			</span>
		</div>
	);
}
