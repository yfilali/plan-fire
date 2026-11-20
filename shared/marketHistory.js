// ─────────────────────────────────────────────────────────────────────────
//  PlanFIRE — Historical market dataset (server-side seed)
//
//  Annual NOMINAL total returns by asset class, 1928 → 2025. This is the
//  reference data that powers the premium "Time Machine" backtest. It ships
//  with the server as code (not in the mutable /data store) so it can never
//  be wiped by a user "reset" and survives every rebuild.
//
//  Columns (all percent, total return incl. income where applicable):
//    stocks     — S&P 500, price + dividends
//    tbills     — 3-month U.S. Treasury bill
//    tbonds     — 10-year U.S. Treasury bond (coupon + price)
//    corp       — Moody's Baa-rated corporate bonds (coupon + price)
//    realEstate — U.S. residential real estate (Case-Shiller home price index)
//    gold       — London spot gold, USD
//    inflation  — U.S. CPI-U, annual average
//
//  Sources (public, widely cited, free):
//    • Aswath Damodaran, NYU Stern — "Historical Returns on Stocks, Bonds,
//      Bills, Real Estate and Gold" (annual update). Stocks/bills/bonds/corp/
//      real-estate/gold columns.
//      https://pages.stern.nyu.edu/~adamodar/New_Home_Page/datafile/histretSP.html
//    • Robert Shiller / S&P CoreLogic Case-Shiller — residential real estate.
//    • U.S. Bureau of Labor Statistics (CPI-U) — inflation column.
//
//  To refresh: replace the RAW rows below with the latest published years.
//  Each row is [year, stocks, tbills, tbonds, corp, realEstate, gold, inflation].
// ─────────────────────────────────────────────────────────────────────────

// Raw percentages exactly as published — kept human-readable for auditing.
// prettier-ignore
const RAW = [
	[1928, 43.81, 3.08, 0.84, 3.22, 1.49, 0.10, -1.7],
	[1929, -8.30, 3.16, 4.20, 3.02, -2.06, -0.15, 0.0],
	[1930, -25.12, 4.55, 4.54, 0.54, -4.30, 0.10, -2.3],
	[1931, -43.84, 2.31, -2.56, -15.68, -8.15, -17.38, -9.0],
	[1932, -8.64, 1.07, 8.79, 23.59, -10.47, 21.28, -9.9],
	[1933, 49.98, 0.96, 1.86, 12.97, -3.81, 27.26, -5.1],
	[1934, -1.19, 0.28, 7.96, 18.82, 2.91, 31.75, 3.1],
	[1935, 46.74, 0.17, 4.47, 13.31, 9.77, 0.43, 2.2],
	[1936, 31.94, 0.17, 5.02, 11.38, 3.22, 0.09, 1.5],
	[1937, -35.34, 0.28, 1.38, -4.42, 2.56, -0.23, 3.6],
	[1938, 29.28, 0.07, 4.21, 9.24, -0.87, 0.17, -2.1],
	[1939, -1.10, 0.05, 4.41, 7.98, -1.30, -1.23, -1.4],
	[1940, -10.67, 0.04, 5.40, 8.65, 3.31, -1.66, 0.7],
	[1941, -12.77, 0.13, -2.02, 5.01, -8.38, 0.00, 5.0],
	[1942, 19.17, 0.34, 2.29, 5.18, 3.33, 0.00, 10.9],
	[1943, 25.06, 0.38, 2.49, 8.04, 11.45, 0.00, 6.1],
	[1944, 19.03, 0.38, 2.58, 6.57, 16.58, 0.00, 1.7],
	[1945, 35.82, 0.38, 3.80, 6.80, 11.78, 2.54, 2.3],
	[1946, -8.43, 0.38, 3.13, 2.51, 24.10, 0.00, 8.3],
	[1947, 5.20, 0.60, 0.92, 0.26, 21.26, 0.00, 14.4],
	[1948, 5.70, 1.05, 1.95, 3.44, 2.06, 0.00, 8.1],
	[1949, 18.30, 1.12, 4.66, 5.38, 0.09, -8.70, -1.2],
	[1950, 30.81, 1.20, 0.43, 4.24, 3.64, 9.56, 1.3],
	[1951, 23.68, 1.52, -0.30, -0.19, 6.05, 0.00, 7.9],
	[1952, 18.15, 1.72, 2.27, 4.44, 4.41, -0.35, 1.9],
	[1953, -1.21, 1.89, 4.14, 1.62, 11.52, 0.69, 0.8],
	[1954, 52.56, 0.94, 3.29, 6.16, 0.92, 0.57, 0.7],
	[1955, 32.60, 1.72, -1.34, 2.04, 0.00, -0.03, -0.4],
	[1956, 7.44, 2.62, -2.26, -2.35, 0.91, -0.11, 1.5],
	[1957, -10.46, 3.22, 6.80, -0.72, 2.72, -0.11, 3.3],
	[1958, 43.72, 1.77, -2.10, 6.43, 0.66, 0.43, 2.8],
	[1959, 12.06, 3.39, -2.65, 1.57, 0.11, 0.00, 0.7],
	[1960, 0.34, 2.87, 11.64, 6.66, 0.77, 0.48, 1.7],
	[1961, 26.64, 2.35, 2.06, 5.10, 0.98, -0.06, 1.0],
	[1962, -8.81, 2.77, 5.69, 6.50, 0.32, -0.06, 1.0],
	[1963, 22.61, 3.16, 1.68, 5.46, 2.14, -0.40, 1.3],
	[1964, 16.42, 3.55, 3.73, 5.16, 1.26, 0.03, 1.3],
	[1965, 12.40, 3.95, 0.72, 3.19, 1.66, 0.06, 1.6],
	[1966, -9.97, 4.86, 2.91, -3.45, 1.22, 0.03, 2.9],
	[1967, 23.80, 4.29, -1.58, 0.90, 2.32, -0.51, 3.1],
	[1968, 10.81, 5.34, 3.27, 4.85, 4.13, 12.47, 4.2],
	[1969, -8.24, 6.67, -5.01, -2.03, 6.99, 5.01, 5.5],
	[1970, 3.56, 6.39, 16.75, 5.65, 8.22, -9.45, 5.7],
	[1971, 14.22, 4.33, 9.79, 14.00, 4.24, 16.69, 4.4],
	[1972, 18.76, 4.06, 2.82, 11.41, 2.98, 48.78, 3.2],
	[1973, -14.31, 7.04, 3.66, 4.32, 3.42, 72.96, 6.2],
	[1974, -25.90, 7.85, 1.99, -4.38, 10.07, 66.15, 11.0],
	[1975, 37.00, 5.79, 3.61, 11.05, 6.77, -24.80, 9.1],
	[1976, 23.83, 4.98, 15.98, 19.75, 8.18, -4.10, 5.8],
	[1977, -6.98, 5.26, 1.29, 9.95, 14.65, 22.64, 6.5],
	[1978, 6.51, 7.18, -0.78, 3.14, 15.72, 37.01, 7.6],
	[1979, 18.52, 10.05, 0.67, -2.01, 13.74, 126.55, 11.3],
	[1980, 31.74, 11.39, -2.99, -3.32, 7.40, 15.19, 13.5],
	[1981, -4.70, 14.04, 8.20, 8.46, 5.10, -32.60, 10.3],
	[1982, 20.42, 11.09, 32.81, 29.05, 0.56, 15.62, 6.2],
	[1983, 22.34, 8.95, 3.20, 16.19, 4.75, -16.80, 3.2],
	[1984, 6.15, 9.92, 13.73, 15.62, 4.68, -19.38, 4.3],
	[1985, 31.24, 7.72, 25.71, 23.86, 7.47, 6.00, 3.6],
	[1986, 18.49, 6.15, 24.28, 22.15, 9.61, 18.96, 1.9],
	[1987, 5.81, 5.96, -4.96, 1.12, 7.85, 24.53, 3.6],
	[1988, 16.54, 6.89, 8.22, 15.68, 7.22, -15.26, 4.1],
	[1989, 31.48, 8.39, 17.69, 16.31, 4.39, -2.84, 4.8],
	[1990, -3.06, 7.75, 6.24, 5.65, -0.69, -3.11, 5.4],
	[1991, 30.23, 5.54, 15.00, 16.40, -0.17, -8.56, 4.2],
	[1992, 7.49, 3.51, 9.36, 13.68, 0.82, -5.73, 3.0],
	[1993, 9.97, 3.07, 14.21, 16.44, 2.16, 17.68, 3.0],
	[1994, 1.33, 4.37, -8.04, -1.23, 2.52, -2.17, 2.6],
	[1995, 37.20, 5.66, 23.48, 20.09, 1.79, 0.98, 2.8],
	[1996, 22.68, 5.15, 1.43, 5.28, 2.43, -4.59, 3.0],
	[1997, 33.10, 5.20, 9.94, 11.30, 4.02, -21.41, 2.3],
	[1998, 28.34, 4.91, 14.92, 8.10, 6.44, -0.83, 1.6],
	[1999, 20.89, 4.78, -8.25, 0.97, 7.68, 0.85, 2.2],
	[2000, -9.03, 6.00, 16.66, 9.38, 9.29, -5.44, 3.4],
	[2001, -11.85, 3.48, 5.57, 8.60, 6.68, 0.75, 2.8],
	[2002, -21.97, 1.64, 15.12, 12.06, 9.56, 25.57, 1.6],
	[2003, 28.36, 1.03, 0.38, 12.38, 9.81, 19.89, 2.3],
	[2004, 10.74, 1.40, 4.49, 10.33, 13.64, 4.65, 2.7],
	[2005, 4.83, 3.22, 2.87, 5.13, 13.51, 17.77, 3.4],
	[2006, 15.61, 4.85, 1.96, 5.27, 1.73, 23.20, 3.2],
	[2007, 5.48, 4.48, 10.21, 4.90, -5.40, 31.92, 2.8],
	[2008, -36.55, 1.40, 20.10, -3.44, -12.00, 4.32, 3.8],
	[2009, 25.94, 0.15, -11.12, 19.96, -3.85, 25.04, -0.4],
	[2010, 14.82, 0.14, 8.46, 9.40, -4.12, 29.24, 1.6],
	[2011, 2.10, 0.05, 16.04, 12.26, -3.89, 12.02, 3.2],
	[2012, 15.89, 0.09, 2.97, 9.40, 6.44, 5.68, 2.1],
	[2013, 32.15, 0.06, -9.10, -1.13, 10.72, -27.61, 1.5],
	[2014, 13.52, 0.03, 10.75, 10.75, 4.50, 0.12, 1.6],
	[2015, 1.38, 0.05, 1.28, -1.50, 5.19, -12.11, 0.1],
	[2016, 11.77, 0.32, 0.69, 11.52, 5.31, 8.10, 1.3],
	[2017, 21.61, 0.95, 2.80, 9.15, 6.21, 12.66, 2.1],
	[2018, -4.23, 1.97, -0.02, -3.18, 4.52, -0.93, 2.4],
	[2019, 31.21, 2.11, 9.64, 15.25, 3.69, 19.08, 1.8],
	[2020, 18.02, 0.36, 11.33, 10.60, 10.43, 24.17, 1.2],
	[2021, 28.47, 0.04, -4.42, 1.02, 18.86, -3.75, 4.7],
	[2022, -18.04, 2.09, -17.83, -15.23, 5.65, 0.55, 8.0],
	[2023, 26.06, 5.28, 3.88, 8.74, 5.68, 13.26, 4.1],
	[2024, 24.88, 5.18, -1.64, 1.74, 3.96, 25.96, 2.9],
	[2025, 17.78, 4.21, 7.80, 6.96, 1.58, 66.22, 2.6],
];

// Investable asset classes the user can allocate across in a backtest. `key`
// indexes a row in SERIES; `tone` is a theme palette key resolved client-side.
export const ASSET_CLASSES = [
	{ id: "stocks", label: "US Stocks", short: "Stocks", icon: "📈", tone: "accent", blurb: "S&P 500, dividends reinvested." },
	{ id: "tbonds", label: "Treasury Bonds", short: "Bonds", icon: "🏛️", tone: "blue", blurb: "10-year US Treasury, coupon + price." },
	{ id: "corp", label: "Corporate Bonds", short: "Corp", icon: "🏢", tone: "purple", blurb: "Baa-rated corporate bonds." },
	{ id: "realEstate", label: "Real Estate", short: "Real estate", icon: "🏠", tone: "warning", blurb: "US home prices (Case-Shiller)." },
	{ id: "gold", label: "Gold", short: "Gold", icon: "🥇", tone: "warning", blurb: "London spot gold, USD." },
	{ id: "tbills", label: "Cash (T-Bills)", short: "Cash", icon: "💵", tone: "textMuted", blurb: "3-month US Treasury bills." },
];

// Famous regimes — one-tap presets that pick a window for the user.
export const ERA_PRESETS = [
	{ id: "depression", label: "The Great Depression", years: [1929, 1938], icon: "📉", blurb: "The crash and the long climb out." },
	{ id: "warboom", label: "Post-War Boom", years: [1949, 1968], icon: "🏗️", blurb: "Two decades of broad expansion." },
	{ id: "stagflation", label: "Stagflation", years: [1973, 1982], icon: "🛢️", blurb: "Oil shocks, high inflation, flat stocks — gold's decade." },
	{ id: "longbull", label: "The Long Bull", years: [1982, 1999], icon: "🚀", blurb: "The greatest bull market in history." },
	{ id: "lostdecade", label: "The Lost Decade", years: [2000, 2009], icon: "🐻", blurb: "Dot-com bust into the financial crisis." },
	{ id: "gfc", label: "Global Financial Crisis", years: [2007, 2009], icon: "💥", blurb: "The sharpest modern drawdown." },
	{ id: "recovery", label: "The Recovery", years: [2009, 2021], icon: "📊", blurb: "QE-era bull run and the everything rally." },
	{ id: "covidinfl", label: "COVID & Inflation", years: [2020, 2025], icon: "🦠", blurb: "Crash, melt-up, then the inflation shock." },
];

const COLS = ["stocks", "tbills", "tbonds", "corp", "realEstate", "gold", "inflation"];

// Convert raw percent rows → { year, <class>: decimalReturn, ... }.
export const SERIES = RAW.map((row) => {
	const rec = { year: row[0] };
	COLS.forEach((c, i) => {
		rec[c] = Math.round(row[i + 1] * 1e4) / 1e6; // percent → decimal, 6dp
	});
	return rec;
});

export const META = {
	minYear: RAW[0][0],
	maxYear: RAW[RAW.length - 1][0],
	count: RAW.length,
	source: "Damodaran (NYU Stern), Case-Shiller / Shiller, BLS CPI-U",
	currency: "USD",
	basis: "nominal annual total return",
};

// Single payload served to the client.
export const MARKET_HISTORY = { meta: META, classes: ASSET_CLASSES, eras: ERA_PRESETS, series: SERIES };
