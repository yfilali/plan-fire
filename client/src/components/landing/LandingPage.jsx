import { useTheme } from "../../theme/ThemeProvider.jsx";
import Nav from "./Nav.jsx";
import Hero from "./Hero.jsx";
import Stats from "./Stats.jsx";
import Features from "./Features.jsx";
import HowItWorks from "./HowItWorks.jsx";
import FAQ from "./FAQ.jsx";
import Footer from "./Footer.jsx";

// Marketing home page ("/"). Composes the section components in order under a
// sticky nav, with a footer at the bottom. Dependency-free — plain anchors and
// inline styles only.
export default function LandingPage() {
	const S = useTheme();

	return (
		<div style={{ background: S.bg, color: S.text, minHeight: "100vh" }}>
			{/* Smooth in-page anchor scrolling; scroll-margin keeps section
			    headings clear of the 64px sticky nav. */}
			<style>{`
				html { scroll-behavior: smooth; }
				section[id] { scroll-margin-top: 80px; }
			`}</style>

			<Nav />
			<main>
				<Hero />
				<Stats />
				<Features />
				<HowItWorks />
				<FAQ />
			</main>
			<Footer />
		</div>
	);
}
