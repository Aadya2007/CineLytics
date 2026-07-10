# 🎬 CineLytics — Movie Insights Dashboard

A premium, Netflix-style movie insights dashboard built with pure HTML, CSS, and JavaScript. Explore top-rated movies, discover hidden gems, and dive into beautiful analytics — all in an immersive, cinematic interface.

![CineLytics Dashboard](https://img.shields.io/badge/CineLytics-Movie%20Dashboard-e50914?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0id2hpdGUiPjxwb2x5Z29uIHBvaW50cz0iNSAzIDE5IDEyIDUgMjEgNSAzIi8+PC9zdmc+)

## ✨ Features

- **🎥 Hero Banner** — Auto-rotating featured movies with cinematic backdrop
- **📺 Continue Watching** — Track your progress with visual progress bars
- **⭐ Top Rated & Trending** — Curated movie collections with IMDb-style ratings
- **🔍 Smart Search** — Real-time filtering by title, director, cast, or genre
- **🎭 Genre & Service Filters** — Filter by streaming platform or genre
- **📊 Community Analytics** — Interactive charts (ratings distribution, genre donut, scatter plot, timeline)
- **🌙 Dark/Light Theme** — Toggle between stunning dark and clean light themes
- **🎬 Movie Detail Modals** — Rich detail views with posters, cast, and ratings
- **🏠 Multi-Page Navigation** — Home, Discover, Community, Top Rated, Settings
- **📱 Responsive Design** — Adapts beautifully to all screen sizes

## 🚀 Getting Started

### Prerequisites

No build tools, frameworks, or package managers needed! This is pure HTML/CSS/JS.

### Running Locally

1. Clone the repository:
   ```bash
   git clone https://github.com/Aadya2007/Cinelytics.git
   cd Cinelytics
   ```

2. Open `index.html` in your browser:
   ```bash
   # Option 1: Direct open
   start index.html

   # Option 2: Use a local server (recommended for best experience)
   npx serve .

   # Option 3: Python server
   python -m http.server 8000
   ```

3. Enjoy! 🍿

## 🎨 Design Highlights

| Feature | Description |
|---------|-------------|
| **Color Palette** | Netflix red (#e50914) accent with dark navy backgrounds |
| **Typography** | Inter font family for clean, modern readability |
| **Glassmorphism** | Frosted glass cards with blur effects |
| **Micro-animations** | Smooth hover states, fade-ins, and transitions |
| **Custom Charts** | Hand-crafted Canvas 2D visualizations (no chart library needed!) |
| **Custom Scrollbar** | Thin, themed scrollbar that matches the UI |

## 📁 Project Structure

```
Cinelytics/
├── index.html       # Main application structure
├── styles.css       # Complete styling (800+ lines)
├── data.js          # Movie dataset (30 curated movies with real TMDB posters)
├── app.js           # Application logic (navigation, charts, filters, modals)
├── README.md        # This file
└── .gitignore       # Git ignore rules
```

## 🖼️ Pages

- **Home** — Hero banner, Continue Watching, Top Rated, Trending
- **Discovery** — Browse all movies with genre filter pills
- **Community** — Analytics dashboard with interactive charts
- **Top Rated** — All movies sorted by rating
- **Settings** — Theme toggle, notification preferences, language selection

## 🛠️ Technologies

- **HTML5** — Semantic markup with accessibility considerations
- **CSS3** — Custom properties, Grid, Flexbox, animations, glassmorphism
- **Vanilla JavaScript** — ES6+, no frameworks, no dependencies
- **Canvas 2D** — Custom chart rendering (bar, donut, scatter, line charts)
- **Google Fonts** — Inter typeface
- **TMDB Images** — Real movie posters and backdrops

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the [issues page](https://github.com/Aadya2007/Cinelytics/issues).

---

<p align="center">Built with 💙 for cinephiles everywhere</p>
