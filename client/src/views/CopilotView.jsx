import Copilot from "../components/ai/Copilot.jsx";

// Thin view wrapper around the Copilot leaf component.
export default function CopilotView() {
	return (
		<div className="fade-in">
			<Copilot />
		</div>
	);
}
