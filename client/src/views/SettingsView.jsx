import { SectionTitle } from "../components/ui.jsx";
import ProfileSettings from "../components/settings/ProfileSettings.jsx";
import MarketSettings from "../components/settings/MarketSettings.jsx";
import DataSettings from "../components/settings/DataSettings.jsx";

export default function SettingsView() {
	return (
		<div className="fade-in" style={{ display: "grid", gap: 16 }}>
			<SectionTitle sub="Everything that drives the projection. Changes apply to the active plan. Manage what you own on the Assets tab.">
				Assumptions
			</SectionTitle>
			<ProfileSettings />
			<MarketSettings />
			<DataSettings />
		</div>
	);
}
