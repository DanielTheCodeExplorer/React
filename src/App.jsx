  import './App.css'
  import Footer from'./components/Footer.jsx'
  import Map from './components/Map.jsx'

export default function App() {
  return (
   <div className="flex flex-col h-screen overflow-hidden">
      <Map className="flex-[5]" />
      <Footer className="flex-[1]" />
    </div>

  );
}


