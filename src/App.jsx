import ScrollExperience from './components/ScrollExperience';

function App() {
  return (
    <div className="relative bg-background text-text-main min-h-screen selection:bg-electric selection:text-black">
      <div className="noise-overlay" />
      <ScrollExperience />
    </div>
  );
}

export default App;
