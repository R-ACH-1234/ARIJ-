/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { Play, Pause, Heart, Search, Plus, X, Volume2, VolumeX, ListMusic, Radio as RadioIcon } from 'lucide-react';
import Hls from 'hls.js';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './lib/utils';

interface RadioStation {
  id: string;
  Title: string;
  Url: string;
  Genre: string;
  Logo?: string;
  isCustom?: boolean;
}

const DEFAULT_STATIONS: Omit<RadioStation, 'id'>[] = [
  { Title: "MFM Radio", Url: "https://a5.asurahosting.com:7980/radio.mp3", Genre: "featured", Logo: "/mfm.jpg" },
  { Title: "Medi 1 Radio", Url: "https://cdn.live.easybroadcast.io/live/83_medi1radio-maghreb_8s9i4bn/chunks.m3u8", Genre: "featured", Logo: "https://www.medi1.com/assets/img/logo_medi1.png" },
  { Title: "Radio 2M", Url: "https://cdn-globecast.akamaized.net/live/eds/radio_2m/radio_hls_ts_hy217612tge1f21j83/radio_2m-mp4a_130400=1.m3u8", Genre: "featured", Logo: "https://upload.wikimedia.org/wikipedia/commons/4/4b/2M_Maroc_logo.svg" },
  { Title: "Hit Radio", Url: "https://hitradio-maroc.ice.infomaniak.ch/hitradio-maroc-128.mp3", Genre: "featured", Logo: "https://www.hitradio.ma/themes/custom/hitradio/logo.svg" },
  { Title: "Radio Mars", Url: "https://radiomars.ice.infomaniak.ch/radiomars-128.mp3", Genre: "featured", Logo: "https://www.radiomars.ma/wp-content/themes/radiomars/images/logo.png" },
  { Title: "Radio Aswat", Url: "https://aswat.ice.infomaniak.ch/aswat-high.mp3", Genre: "featured", Logo: "https://www.aswat.ma/assets/img/logo.png" },
  { Title: "Chada FM", Url: "https://edge16.vedge.infomaniak.com/livecast/ik:chadatv/chunklist_.m3u8", Genre: "featured", Logo: "https://www.chadafm.ma/wp-content/uploads/2019/01/logo-chada-fm.png" },
  { Title: "Radio Coran", Url: "https://virmach2.hajjam.net/index.html", Genre: "dini", Logo: "https://upload.wikimedia.org/wikipedia/commons/c/c5/Logo_Assadissa.png" },
  { Title: "Cap Radio", Url: "https://listen.radioking.com/radio/710810/stream/776366", Genre: "cities", Logo: "https://www.capradio.ma/wp-content/uploads/2020/06/logo-capradio.png" }
];

const StationLogo = ({ src, alt, className }: { src?: string, alt: string, className?: string }) => {
  const [error, setError] = useState(false);
  
  if (!src || error) {
    return (
      <div className={cn("flex items-center justify-center font-bold bg-red-500/20 text-red-500", className)}>
        A
      </div>
    );
  }
  
  return (
    <div className={cn("bg-white/90 p-1 flex items-center justify-center rounded-xl", className)}>
      <img 
        src={src} 
        alt={alt} 
        className="w-full h-full object-contain mix-blend-multiply"
        onError={() => setError(true)}
      />
    </div>
  );
};

export default function App() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const hlsRef = useRef<Hls | null>(null);
  
  const [stations, setStations] = useState<RadioStation[]>([]);
  const [search, setSearch] = useState("");
  const [favorites, setFavorites] = useState<string[]>([]);
  
  const [currentStation, setCurrentStation] = useState<RadioStation | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [errorStatus, setErrorStatus] = useState<string | null>(null);
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [newGenre, setNewGenre] = useState("");
  
  const [filterType, setFilterType] = useState<string>('all');
  const [greeting, setGreeting] = useState<string>("");

  useEffect(() => {
    const updateGreeting = () => {
      const now = new Date();
      const hour = now.getHours();
      const minute = now.getMinutes();
      const timeInHours = hour + minute / 60;
      
      if (timeInHours >= 7 && timeInHours <= 12) {
        setGreeting("أريج كتصبح عليكم ☀️");
      } else if (timeInHours > 12 && timeInHours <= 19) {
        setGreeting("أريج كتمسي عليكم 🌅");
      } else {
        setGreeting("أريج كتقول ليكم ليلة سعيدة 🌙");
      }
    };
    
    updateGreeting();
    const intervalId = setInterval(updateGreeting, 60000);
    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    // Load local storage data
    const savedFavorites = localStorage.getItem('morocco_radio_favorites');
    if (savedFavorites) {
      setFavorites(JSON.parse(savedFavorites));
    }

    const savedCustomStations = localStorage.getItem('morocco_radio_custom');
    const customStations: RadioStation[] = savedCustomStations ? JSON.parse(savedCustomStations) : [];
    
    const formattedDefaultStations = DEFAULT_STATIONS.map(s => ({
      ...s,
      id: s.Title.toLowerCase().replace(/\\s+/g, '-')
    }));

    setStations([...formattedDefaultStations, ...customStations]);
  }, []);

  useEffect(() => {
    localStorage.setItem('morocco_radio_favorites', JSON.stringify(favorites));
  }, [favorites]);

  const toggleFavorite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavorites(prev => 
      prev.includes(id) ? prev.filter(fid => fid !== id) : [...prev, id]
    );
  };

  const decodeUrl = (url: string) => {
    try {
      return decodeURIComponent(url);
    } catch {
      return url;
    }
  };

  const playStation = (station: RadioStation) => {
    setCurrentStation(station);
    setIsPlaying(true);
    setErrorStatus(null);
  };

  useEffect(() => {
    if (!currentStation || !audioRef.current) return;

    const audio = audioRef.current;
    const url = decodeUrl(currentStation.Url);

    // Cleanup previous HLS instance
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    // Reset audio state
    audio.pause();
    audio.removeAttribute('src');
    audio.load();

    const playAudio = () => {
      audio.play().catch(e => {
        console.error("Playback failed:", e);
        setErrorStatus("Failed to play stream");
        setIsPlaying(false);
      });
    };

    if (url.includes('.m3u8')) {
      if (Hls.isSupported()) {
        const hls = new Hls({
          enableWorker: true,
          lowLatencyMode: true,
        });
        hlsRef.current = hls;
        
        hls.loadSource(url);
        hls.attachMedia(audio);
        
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          if (isPlaying) playAudio();
        });
        
        hls.on(Hls.Events.ERROR, (event, data) => {
          if (data.fatal) {
            console.error("HLS Error:", data);
            setErrorStatus("Stream error");
            setIsPlaying(false);
          }
        });
      } else if (audio.canPlayType('application/vnd.apple.mpegurl')) {
        // Native HLS (Safari)
        audio.src = url;
        audio.addEventListener('loadedmetadata', () => {
          if (isPlaying) playAudio();
        }, { once: true });
        
        audio.addEventListener('error', () => {
          setErrorStatus("Stream error");
          setIsPlaying(false);
        }, { once: true });
      }
    } else {
      // Standard MP3/AAC stream
      audio.src = url;
      if (isPlaying) playAudio();
      
      audio.addEventListener('error', () => {
        setErrorStatus("Stream error");
        setIsPlaying(false);
      }, { once: true });
    }
    
    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [currentStation]);

  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying && audioRef.current.paused) {
        audioRef.current.play().catch(() => setIsPlaying(false));
      } else if (!isPlaying && !audioRef.current.paused) {
        audioRef.current.pause();
      }
    }
  }, [isPlaying]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  const togglePlay = () => {
    if (!currentStation) return;
    setIsPlaying(!isPlaying);
  };

  const handleAddCustomStation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newUrl.trim()) return;

    const newStation: RadioStation = {
      id: "custom-" + Date.now(),
      Title: newTitle,
      Url: newUrl,
      Genre: newGenre || "Custom",
      isCustom: true
    };

    const updatedStations = [...stations, newStation];
    setStations(updatedStations);
    
    const customStations = updatedStations.filter(s => s.isCustom);
    localStorage.setItem('morocco_radio_custom', JSON.stringify(customStations));

    setNewTitle("");
    setNewUrl("");
    setNewGenre("");
    setIsAddModalOpen(false);
  };

  const filteredStations = stations.filter(s => {
    const matchesSearch = s.Title.toLowerCase().includes(search.toLowerCase()) || 
                          s.Genre.toLowerCase().includes(search.toLowerCase());
    
    let matchesFilter = true;
    if (filterType === 'favorites') {
      matchesFilter = favorites.includes(s.id);
    } else if (filterType !== 'all') {
      matchesFilter = s.Genre === filterType;
    }

    return matchesSearch && matchesFilter;
  });

  const genres = Array.from(new Set(stations.map(s => s.Genre))).filter(Boolean).sort();

  return (
    <div className="flex flex-col md:flex-row h-[100dvh] w-full relative overflow-hidden bg-[#050608] text-[#e5e7eb] font-sans selection:bg-emerald-500/30">
      <audio ref={audioRef} />
      
      <div className="glow-orb hidden md:block" style={{ top: '-100px', left: '-100px' }}></div>
      <div className="glow-orb hidden md:block" style={{ bottom: '-100px', right: '-100px' }}></div>

      {/* Sidebar */}
      <aside className="w-full md:w-64 glass md:border-r border-b md:border-b-0 border-white/10 flex flex-row md:flex-col p-4 md:p-6 z-10 shrink-0 overflow-x-auto md:overflow-y-auto hide-scrollbar">
        <div className="flex items-center gap-3 md:mb-10 shrink-0 mr-6 md:mr-0">
          <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <RadioIcon className="w-6 h-6 text-black" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white whitespace-nowrap">
            ARIJ RADIO <span className="text-emerald-500">PRO</span>
          </h1>
        </div>
        
        <nav className="flex md:flex-col gap-4 md:gap-6 text-sm flex-1">
          <div className="flex md:flex-col gap-2 shrink-0">
            <p className="hidden md:block text-gray-500 uppercase text-[10px] font-bold tracking-widest px-2">Main</p>
            <button onClick={() => setFilterType('all')} className={cn("flex items-center gap-2 md:gap-3 px-3 py-2 rounded-lg font-medium transition-colors whitespace-nowrap", filterType === 'all' ? "bg-emerald-500/10 text-emerald-400" : "text-gray-400 hover:text-white")}>
              <Search className="w-4 h-4" />
              <span>Explore</span>
            </button>
            <button onClick={() => setFilterType('favorites')} className={cn("flex items-center gap-2 md:gap-3 px-3 py-2 rounded-lg font-medium transition-colors whitespace-nowrap", filterType === 'favorites' ? "bg-emerald-500/10 text-emerald-400" : "text-gray-400 hover:text-white")}>
               <Heart className={cn("w-4 h-4", filterType === 'favorites' && "fill-emerald-400")} />
               <span>Favorites</span>
            </button>
          </div>

          <div className="flex md:flex-col gap-2 shrink-0">
            <p className="hidden md:block text-gray-500 uppercase text-[10px] font-bold tracking-widest px-2">Genres</p>
            {genres.map(genre => (
               <button key={genre} onClick={() => setFilterType(genre)} className={cn("flex items-center gap-3 px-3 py-2 rounded-lg transition-colors whitespace-nowrap capitalize", filterType === genre ? "bg-emerald-500/10 text-emerald-400" : "text-gray-400 hover:text-white")}>
                 <span>{genre}</span>
               </button>
            ))}
          </div>
        </nav>
        
        <div className="mt-auto pt-6 hidden md:block shrink-0">
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="w-full glass border-emerald-500/30 text-emerald-400 text-xs py-3 rounded-xl hover:bg-emerald-500 hover:text-black transition-all flex items-center justify-center gap-2"
          >
            <span>Add Custom URL</span>
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col z-10 min-w-0 min-h-0 bg-[#050608]/50 md:bg-transparent">
        <header className="h-16 md:h-20 shrink-0 flex items-center justify-between px-6 md:px-10 border-b border-white/5">
          <div className="relative w-full md:w-96 max-w-full md:mr-4">
             <input 
                type="text" 
                placeholder="Search stations, cities..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-full py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-emerald-500/50 transition-all text-white placeholder:text-gray-500"
              />
              <Search className="w-4 h-4 text-gray-500 absolute left-4 top-1/2 -translate-y-1/2" />
          </div>
          <div className="hidden md:flex items-center gap-4 text-sm font-medium shrink-0">
             <span className="text-emerald-500 flex items-center gap-2">
               <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
               Live Now: {stations.length}
             </span>
             <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-500 flex items-center justify-center border-2 border-white/10 text-black font-bold">
               M
             </div>
          </div>
          {/* Mobile add button */}
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="md:hidden flex-shrink-0 ml-4 w-10 h-10 rounded-full glass border-emerald-500/30 text-emerald-400 flex items-center justify-center transition-colors"
          >
            <Plus className="w-5 h-5" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-6 md:p-10 relative">
          {filterType === 'all' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-8 p-4 md:p-6 rounded-2xl glass border-emerald-500/30 bg-emerald-500/5 flex items-center justify-center relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 via-transparent to-emerald-500/10"></div>
              <h2 className="text-xl md:text-2xl font-bold text-white relative z-10 text-center tracking-wide" dir="rtl">
                {greeting}
              </h2>
            </motion.div>
          )}

          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-semibold text-white">
              {filterType === 'all' ? 'Featured Stations' : filterType === 'favorites' ? 'Your Favorites' : `${filterType} Stations`}
            </h2>
          </div>

          {filteredStations.length === 0 ? (
             <div className="flex flex-col items-center justify-center h-64 text-gray-500">
               <ListMusic className="w-12 h-12 mb-4 opacity-20 text-emerald-500" />
               <p>No stations found matching your criteria</p>
             </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              <AnimatePresence mode="popLayout">
                {filteredStations.map((station) => {
                  const isFavorite = favorites.includes(station.id);
                  const isActive = currentStation?.id === station.id;
                  
                  // Generate an abbreviation from Title loosely matching the original design
                  const abbreviation = station.Title.replace(/radio\s+/i, '').substring(0, 2).toUpperCase();
                  
                  return (
                    <motion.div
                      layout
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.2 }}
                      key={station.id}
                      onClick={() => playStation(station)}
                      className={cn(
                        "station-card glass p-5 rounded-2xl flex flex-col group",
                        isActive ? "active-glow border-emerald-500/40 bg-white/[0.05]" : "border-white/5"
                      )}
                    >
                      <div className="flex justify-between items-start mb-4">
                        <StationLogo 
                          src={station.Logo} 
                          alt={station.Title} 
                          className={cn(
                            "w-14 h-14 rounded-xl",
                            !station.Logo && (isActive ? "bg-emerald-500/20 text-emerald-500" : "bg-white/5 text-gray-400 group-hover:bg-white/10 group-hover:text-emerald-400")
                          )} 
                        />
                        <button 
                          onClick={(e) => toggleFavorite(station.id, e)}
                          className="text-gray-500 hover:text-emerald-500 transition-colors p-1 z-10"
                        >
                          <Heart className={cn("w-5 h-5", isFavorite && "fill-emerald-500 text-emerald-500")} />
                        </button>
                      </div>
                      
                      <h3 className="font-bold mb-1 line-clamp-1 text-white">{station.Title}</h3>
                      <p className="text-xs text-gray-500 capitalize">{station.Genre} {station.isCustom ? '• Custom' : '• HLS/MP3'}</p>
                      
                      <div className="mt-4 flex items-center justify-between text-[10px] uppercase tracking-tighter font-bold h-6">
                         {isActive && isPlaying && !errorStatus ? (
                           <>
                             <span className="text-emerald-500">PLAYING NOW</span>
                             <div className="wave-container">
                               {[1, 2, 3, 4].map(i => (
                                 <div 
                                   key={i} 
                                   className="wave-bar" 
                                   style={{ 
                                     animationDuration: `${0.5 + Math.random() * 0.5}s`,
                                     animationDelay: `${i * 0.1}s` 
                                   }} 
                                 />
                               ))}
                             </div>
                           </>
                         ) : isActive && errorStatus ? (
                           <span className="text-red-400">STREAM ERROR</span>
                         ) : isActive ? (
                           <span className="text-emerald-500 animate-pulse">CONNECTING...</span>
                         ) : (
                           <span className="text-gray-600 group-hover:text-gray-400 transition-colors">CLICK TO LISTEN</span>
                         )}
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Bottom Player */}
        <footer className="h-20 md:h-24 glass border-t border-white/10 flex items-center px-4 md:px-8 shrink-0 z-20 bg-[#050608]/90">
          {currentStation ? (
            <>
              <div className="flex items-center gap-3 md:gap-4 w-1/3 md:w-1/4 min-w-0 pr-2 md:pr-0">
                <StationLogo 
                  src={currentStation.Logo} 
                  alt={currentStation.Title} 
                  className="hidden sm:flex w-12 h-12 rounded-lg shrink-0" 
                />
                <div className="min-w-0 flex-1">
                  <h4 className="text-sm font-bold text-white truncate leading-tight">{currentStation.Title}</h4>
                  <p className="text-[10px] text-emerald-500 font-medium truncate mt-0.5">
                    {errorStatus ? <span className="text-red-400">{errorStatus}</span> : "High Quality Stream"}
                  </p>
                </div>
                <button onClick={(e) => toggleFavorite(currentStation.id, e)} className="hidden lg:block text-gray-500 hover:text-emerald-500 ml-2">
                  <Heart className={cn("w-5 h-5", favorites.includes(currentStation.id) && "fill-emerald-500 text-emerald-500")} />
                </button>
              </div>

              <div className="flex-1 flex flex-col items-center justify-center gap-2">
                <div className="flex items-center gap-4 md:gap-6">
                  <button className="text-gray-600 hidden sm:block" disabled>
                     <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7"></path></svg>
                  </button>
                  
                  <button onClick={togglePlay} className="w-10 h-10 md:w-12 md:h-12 bg-white text-black rounded-full flex items-center justify-center hover:scale-105 transition-transform shadow-lg shadow-white/10 shrink-0 group">
                    {isPlaying ? <Pause className="w-4 h-4 md:w-5 md:h-5 text-black" /> : <Play className="w-4 h-4 md:w-5 md:h-5 ml-1 text-black group-hover:text-emerald-600 transition-colors" />}
                  </button>
                  
                  <button className="text-gray-600 hidden sm:block" disabled>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth="2" d="M13 5l7 7-7 7M5 5l7 7-7 7"></path></svg>
                  </button>
                </div>
                
                <div className="w-full max-w-[200px] md:max-w-md h-1 bg-white/10 rounded-full overflow-hidden relative hidden sm:block">
                  {isPlaying && !errorStatus ? (
                     <motion.div 
                       className="absolute left-0 top-0 h-full bg-emerald-500" 
                       initial={{ width: "0%" }}
                       animate={{ width: "100%" }}
                       transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                     />
                  ) : (
                     <div className="absolute left-0 top-0 h-full w-0 bg-gray-500"></div>
                  )}
                </div>
              </div>

              <div className="w-1/3 md:w-1/4 flex items-center justify-end gap-2 md:gap-4 shrink-0">
                <button onClick={() => setIsMuted(!isMuted)} className="text-gray-500 hover:text-white transition-colors p-1">
                  {isMuted || volume === 0 ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                </button>
                <div className="w-16 md:w-24 h-5 cursor-pointer relative flex items-center group hidden sm:flex">
                    <input 
                      type="range" 
                      min="0" 
                      max="1" 
                      step="0.01" 
                      value={isMuted ? 0 : volume}
                      onChange={(e) => {
                        setVolume(parseFloat(e.target.value));
                        if (isMuted) setIsMuted(false);
                      }}
                      className="absolute inset-0 w-full opacity-0 cursor-pointer z-10"
                    />
                    <div className="w-full h-1 bg-white/20 rounded-full transition-all flex items-center group-hover:h-1.5 overflow-hidden">
                       <div className="h-full bg-white rounded-full pointer-events-none" style={{ width: `${(isMuted ? 0 : volume) * 100}%` }}></div>
                    </div>
                </div>
              </div>
            </>
          ) : (
             <div className="w-full flex items-center justify-center text-gray-500 text-xs md:text-sm">
               استكشف إذاعاتك المفضلة (Select a station to start listening)
             </div>
          )}
        </footer>
      </main>

      {/* Add Custom Station Modal */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddModalOpen(false)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
            />
            
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative w-full max-w-md bg-[#050608] border border-white/10 p-6 rounded-3xl shadow-2xl glass"
            >
              <button 
                onClick={() => setIsAddModalOpen(false)}
                className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors p-1"
              >
                <X className="w-5 h-5" />
              </button>
              
              <h2 className="text-xl font-bold mb-6 text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-emerald-500" />
                Add Custom Radio
              </h2>
              
              <form onSubmit={handleAddCustomStation} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 ml-1">Station Name</label>
                  <input
                    required
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="e.g. My Favorite Radio"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-500/50 text-white placeholder:text-gray-600 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 ml-1">Stream URL (HTTPS)</label>
                  <input
                    required
                    type="url"
                    value={newUrl}
                    onChange={(e) => setNewUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-500/50 text-white placeholder:text-gray-600 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 ml-1">Genre (Optional)</label>
                  <input
                    type="text"
                    value={newGenre}
                    onChange={(e) => setNewGenre(e.target.value)}
                    placeholder="e.g. Pop, News, Jazz..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-500/50 text-white placeholder:text-gray-600 transition-colors"
                  />
                </div>
                <div className="pt-4">
                  <button
                    type="submit"
                    className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-bold py-3 px-4 rounded-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                  >
                    Add Station
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

