import ElectionMap from './components/ElectionMap';
import './App.css';

function App() {
  return (
    <div className="app">
      <header className="app-header">
        <h1>US Election Results Map</h1>
      </header>
      <main className="app-main">
        <ElectionMap />
      </main>
    </div>
  );
}

export default App;
