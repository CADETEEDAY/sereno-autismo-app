import React, { useState, useEffect, useRef } from 'react';
import { TextToSpeech } from '@capacitor-community/text-to-speech';
import { 
  MessageSquare, 
  CalendarCheck, 
  HeartHandshake, 
  Sparkles, 
  Volume2, 
  VolumeX, 
  Eye, 
  Trash2, 
  Plus, 
  CheckCircle2, 
  Circle,
  Play,
  Square,
  Smile,
  Meh,
  Frown,
  AlertCircle,
  BatteryLow,
  Sun,
  Coffee,
  Utensils,
  Bed,
  Bath,
  Headphones,
  HelpCircle,
  ThumbsUp,
  ThumbsDown,
  Home,
  Star,
  X,
  RotateCcw
} from 'lucide-react';

const ICON_MAP = {
  Utensils,
  Coffee,
  Bath,
  Bed,
  ThumbsUp,
  ThumbsDown,
  HelpCircle,
  Home,
  Headphones,
  Sun,
  BatteryLow,
  Sparkles,
  Star,
  MessageSquare
};

const DEFAULT_CAA = {
  necessidades: [
    { id: 'n1', label: 'Estou com fome', speech: 'Eu estou com fome', iconName: 'Utensils', color: 'bg-emerald-950/60 border-emerald-700/50 text-emerald-200' },
    { id: 'n2', label: 'Estou com sede', speech: 'Eu quero beber água', iconName: 'Coffee', color: 'bg-sky-950/60 border-sky-700/50 text-sky-200' },
    { id: 'n3', label: 'Banheiro', speech: 'Preciso ir ao banheiro', iconName: 'Bath', color: 'bg-indigo-950/60 border-indigo-700/50 text-indigo-200' },
    { id: 'n4', label: 'Estou cansado', speech: 'Eu estou cansado e preciso descansar', iconName: 'Bed', color: 'bg-purple-950/60 border-purple-700/50 text-purple-200' },
  ],
  respostas: [
    { id: 'r1', label: 'Sim', speech: 'Sim', iconName: 'ThumbsUp', color: 'bg-teal-950/60 border-teal-700/50 text-teal-200' },
    { id: 'r2', label: 'Não', speech: 'Não', iconName: 'ThumbsDown', color: 'bg-rose-950/60 border-rose-700/50 text-rose-200' },
    { id: 'r3', label: 'Preciso de ajuda', speech: 'Você pode me ajudar, por favor?', iconName: 'HelpCircle', color: 'bg-amber-950/60 border-amber-700/50 text-amber-200' },
    { id: 'r4', label: 'Quero ir para casa', speech: 'Eu quero ir para casa', iconName: 'Home', color: 'bg-slate-800 border-slate-600 text-slate-200' },
  ],
  sensorial: [
    { id: 's1', label: 'Muito barulho', speech: 'Está muito barulho aqui, preciso de silêncio', iconName: 'Headphones', color: 'bg-orange-950/60 border-orange-700/50 text-orange-200' },
    { id: 's2', label: 'Muita luz', speech: 'A luz está me incomodando', iconName: 'Sun', color: 'bg-yellow-950/60 border-yellow-700/50 text-yellow-200' },
    { id: 's3', label: 'Preciso de espaço', speech: 'Preciso ficar sozinho um pouco', iconName: 'BatteryLow', color: 'bg-rose-950/60 border-rose-700/50 text-rose-200' },
    { id: 's4', label: 'Pausa sensorial', speech: 'Preciso fazer uma pausa sensorial agora', iconName: 'Sparkles', color: 'bg-indigo-950/60 border-indigo-700/50 text-indigo-200' },
  ],
  meus_cartoes: [
    { id: 'm1', label: 'Meu Hiperfoco', speech: 'Eu quero conversar sobre o assunto que eu gosto', iconName: 'Star', color: 'bg-indigo-950/60 border-indigo-700/50 text-indigo-200', custom: true },
  ]
};

const DEFAULT_TASKS = [
  { id: 1, title: 'Escovar os dentes e lavar o rosto', time: '08:00', done: false },
  { id: 2, title: 'Tomar café da manhã', time: '08:30', done: false },
  { id: 3, title: 'Tempo de estudo ou atividade focada', time: '09:30', done: false },
  { id: 4, title: 'Almoço tranquilo', time: '12:30', done: false },
  { id: 5, title: 'Momento livre / Hiperfoco', time: '14:00', done: false },
  { id: 6, title: 'Preparar para dormir', time: '21:30', done: false },
];

export default function App() {
  const [activeTab, setActiveTab] = useState('caa');
  const [lowStimulus, setLowStimulus] = useState(() => {
    return localStorage.getItem('sereno_low_stimulus') === 'true';
  });
  const [voiceEnabled, setVoiceEnabled] = useState(() => {
    const saved = localStorage.getItem('sereno_voice');
    return saved !== null ? saved === 'true' : true;
  });

  const [caaCategories, setCaaCategories] = useState(() => {
    try {
      const saved = localStorage.getItem('sereno_caa_v1');
      return saved ? JSON.parse(saved) : DEFAULT_CAA;
    } catch {
      return DEFAULT_CAA;
    }
  });
  const [sentence, setSentence] = useState([]);
  const [activeCategory, setActiveCategory] = useState('necessidades');

  const [showAddCardModal, setShowAddCardModal] = useState(false);
  const [newCardLabel, setNewCardLabel] = useState('');
  const [newCardSpeech, setNewCardSpeech] = useState('');
  const [newCardCategory, setNewCardCategory] = useState('meus_cartoes');

  const [tasks, setTasks] = useState(() => {
    try {
      const saved = localStorage.getItem('sereno_tasks_v1');
      return saved ? JSON.parse(saved) : DEFAULT_TASKS;
    } catch {
      return DEFAULT_TASKS;
    }
  });
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskTime, setNewTaskTime] = useState('');

  const [selectedEmotion, setSelectedEmotion] = useState(null);

  const [breathingActive, setBreathingActive] = useState(false);
  const [breathPhase, setBreathPhase] = useState('Inspire...');
  const [isPlayingNoise, setIsPlayingNoise] = useState(false);
  const audioCtxRef = useRef(null);
  const noiseNodeRef = useRef(null);

  useEffect(() => {
    localStorage.setItem('sereno_low_stimulus', String(lowStimulus));
  }, [lowStimulus]);

  useEffect(() => {
    localStorage.setItem('sereno_voice', String(voiceEnabled));
  }, [voiceEnabled]);

  useEffect(() => {
    localStorage.setItem('sereno_caa_v1', JSON.stringify(caaCategories));
  }, [caaCategories]);

  useEffect(() => {
    localStorage.setItem('sereno_tasks_v1', JSON.stringify(tasks));
  }, [tasks]);

  const speak = async (text) => {
    if (!voiceEnabled) return;
    try {
      await TextToSpeech.stop();
      await TextToSpeech.speak({
        text: text,
        lang: 'pt-BR',
        rate: 0.95,
        pitch: 1.0,
        volume: 1.0,
        category: 'ambient',
      });
    } catch {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'pt-BR';
        utterance.rate = 0.95;
        window.speechSynthesis.speak(utterance);
      }
    }
  };

  const handleCardClick = (card) => {
    setSentence((prev) => [...prev, card]);
    speak(card.speech);
  };

  const speakFullSentence = () => {
    if (sentence.length === 0) return;
    const fullText = sentence.map((item) => item.speech).join('. ');
    speak(fullText);
  };

  const handleAddCustomCard = (e) => {
    e.preventDefault();
    if (!newCardLabel.trim()) return;

    const speechText = newCardSpeech.trim() || newCardLabel.trim();
    const newCard = {
      id: `custom_${Date.now()}`,
      label: newCardLabel.trim(),
      speech: speechText,
      iconName: 'Star',
      color: 'bg-indigo-950/60 border-indigo-600/50 text-indigo-200',
      custom: true
    };

    setCaaCategories((prev) => ({
      ...prev,
      [newCardCategory]: [...(prev[newCardCategory] || []), newCard]
    }));

    setActiveCategory(newCardCategory);
    setNewCardLabel('');
    setNewCardSpeech('');
    setShowAddCardModal(false);
    speak(`Cartão ${newCard.label} criado`);
  };

  const handleDeleteCard = (e, categoryKey, cardId) => {
    e.stopPropagation();
    setCaaCategories((prev) => ({
      ...prev,
      [categoryKey]: prev[categoryKey].filter((c) => c.id !== cardId)
    }));
  };

  const toggleTask = (id) => {
    setTasks(tasks.map((t) => {
      if (t.id === id) {
        const nextState = !t.done;
        if (nextState) speak(`Concluído: ${t.title}`);
        return { ...t, done: nextState };
      }
      return t;
    }));
  };

  const addTask = (e) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    const newTask = {
      id: Date.now(),
      title: newTaskTitle.trim(),
      time: newTaskTime || '--:--',
      done: false,
    };
    setTasks([...tasks, newTask]);
    setNewTaskTitle('');
    setNewTaskTime('');
  };

  const deleteTask = (e, id) => {
    e.stopPropagation();
    setTasks(tasks.filter((t) => t.id !== id));
  };

  const resetDayTasks = () => {
    setTasks(tasks.map((t) => ({ ...t, done: false })));
    speak('Rotina do dia reiniciada');
  };

  const completedCount = tasks.filter((t) => t.done).length;
  const progressPercent = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

  const emotions = [
    {
      id: 'calmo',
      label: 'Calmo e Bem',
      desc: 'Estou confortável e regulado.',
      icon: Smile,
      color: 'bg-emerald-950/70 border-emerald-600 text-emerald-300',
      advice: 'Ótimo momento para seguir sua rotina ou aproveitar seus interesses especiais com tranquilidade.'
    },
    {
      id: 'cansado',
      label: 'Bateria Social Baixa',
      desc: 'Cansaço mental ou físico.',
      icon: Meh,
      color: 'bg-sky-950/70 border-sky-600 text-sky-300',
      advice: 'Evite demandas sociais agora. Beba água, diminua o brilho das telas e descanse em um local silencioso.'
    },
    {
      id: 'ansioso',
      label: 'Ansioso / Inquieto',
      desc: 'Muita informação ou mudança inesperada.',
      icon: Frown,
      color: 'bg-amber-950/70 border-amber-600 text-amber-300',
      advice: 'Use objetos de regulação (stims), coloque fones de ouvido ou vá até a aba "Refúgio" para respirar e ouvir ruído marrom.'
    },
    {
      id: 'sobrecarga',
      label: 'Sobrecarga (Crise)',
      desc: 'Sensores no limite. Preciso de apoio imediato.',
      icon: AlertCircle,
      color: 'bg-rose-950/70 border-rose-600 text-rose-300',
      advice: 'Saia do ambiente barulhento/iluminado. Você não precisa forçar a fala agora; use a aba "Comunicar" para mostrar na tela o que precisa.'
    }
  ];

  useEffect(() => {
    if (!breathingActive) {
      setBreathPhase('Pausado');
      return;
    }
    setBreathPhase('Inspire devagar...');
    let step = 0;
    const interval = setInterval(() => {
      step = (step + 1) % 3;
      if (step === 0) setBreathPhase('Inspire devagar...');
      if (step === 1) setBreathPhase('Segure o ar...');
      if (step === 2) setBreathPhase('Solte o ar suavemente...');
    }, 4000);

    return () => clearInterval(interval);
  }, [breathingActive]);

  const toggleBrownNoise = () => {
    if (isPlayingNoise) {
      if (noiseNodeRef.current) {
        noiseNodeRef.current.disconnect();
        noiseNodeRef.current = null;
      }
      if (audioCtxRef.current) {
        audioCtxRef.current.close();
        audioCtxRef.current = null;
      }
      setIsPlayingNoise(false);
    } else {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      const ctx = new AudioContext();
      audioCtxRef.current = ctx;

      const bufferSize = ctx.sampleRate * 3;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = buffer.getChannelData(0);
      let lastOut = 0.0;

      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        output[i] = (lastOut + (0.02 * white)) / 1.02;
        lastOut = output[i];
        output[i] *= 0.15;
      }

      const brownNoise = ctx.createBufferSource();
      brownNoise.buffer = buffer;
      brownNoise.loop = true;

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 600;

      brownNoise.connect(filter);
      filter.connect(ctx.destination);
      brownNoise.start(0);

      noiseNodeRef.current = brownNoise;
      setIsPlayingNoise(true);
    }
  };

  useEffect(() => {
    return () => {
      if (audioCtxRef.current) audioCtxRef.current.close();
    };
  }, []);

  return (
    <div className={`min-h-screen font-sans selection:bg-indigo-500 selection:text-white ${
      lowStimulus ? 'bg-zinc-950 text-zinc-300' : 'bg-slate-950 text-slate-100'
    }`}>
      <header className="sticky top-0 z-20 border-b border-slate-800/80 bg-slate-900/95 backdrop-blur-md px-4 py-3">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-semibold tracking-tight text-slate-100 leading-none">
                Sereno
              </h1>
              <p className="text-[11px] text-slate-400 mt-0.5">Apoio Diário & Regulação</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setVoiceEnabled(!voiceEnabled)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border ${
                voiceEnabled 
                  ? 'bg-indigo-950/80 border-indigo-500/50 text-indigo-200' 
                  : 'bg-slate-800/60 border-slate-700 text-slate-400'
              }`}
            >
              {voiceEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              <span>{voiceEnabled ? 'Voz' : 'Mudo'}</span>
            </button>

            <button
              onClick={() => setLowStimulus(!lowStimulus)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border ${
                lowStimulus 
                  ? 'bg-amber-950/80 border-amber-500/50 text-amber-200' 
                  : 'bg-slate-800/60 border-slate-700 text-slate-300'
              }`}
            >
              <Eye className="w-4 h-4" />
              <span>{lowStimulus ? 'Baixo Estímulo' : 'Padrão'}</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 pt-4 pb-28">
        {activeTab === 'caa' && (
          <section className="space-y-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-inner">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium uppercase tracking-wider text-slate-400">
                  Minha Mensagem
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={speakFullSentence}
                    disabled={sentence.length === 0}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 active:bg-indigo-500 disabled:opacity-40 text-white text-xs font-medium"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                    Falar Frase
                  </button>
                  <button
                    onClick={() => setSentence([])}
                    disabled={sentence.length === 0}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 active:bg-slate-700 disabled:opacity-40 text-slate-300 text-xs"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Limpar
                  </button>
                </div>
              </div>

              <div className="min-h-[60px] flex items-center flex-wrap gap-2 p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
                {sentence.length === 0 ? (
                  <p className="text-xs text-slate-500">
                    Toque nos cartões abaixo para falar ou montar uma frase...
                  </p>
                ) : (
                  sentence.map((item, idx) => (
                    <span
                      key={`${item.id}-${idx}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-sm text-slate-200"
                    >
                      {item.label}
                    </span>
                  ))
                )}
              </div>
            </div>

            <div className="flex items-center justify-between gap-2">
              <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                {[
                  { key: 'necessidades', label: 'Necessidades' },
                  { key: 'respostas', label: 'Respostas' },
                  { key: 'sensorial', label: 'Sensorial' },
                  { key: 'meus_cartoes', label: 'Meus Cartões' }
                ].map((cat) => (
                  <button
                    key={cat.key}
                    onClick={() => setActiveCategory(cat.key)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-medium whitespace-nowrap border ${
                      activeCategory === cat.key
                        ? 'bg-indigo-600/20 border-indigo-500 text-indigo-200'
                        : 'bg-slate-900 border-slate-800 text-slate-400'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setShowAddCardModal(true)}
                className="shrink-0 flex items-center gap-1 px-3 py-2 rounded-xl bg-indigo-600 text-white text-xs font-medium"
              >
                <Plus className="w-4 h-4" />
                <span>Novo</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {(caaCategories[activeCategory] || []).map((card) => {
                const IconComponent = ICON_MAP[card.iconName] || Star;
                return (
                  <div
                    key={card.id}
                    onClick={() => handleCardClick(card)}
                    className={`relative flex flex-col items-center justify-center p-5 rounded-2xl border-2 text-center select-none active:scale-[0.98] cursor-pointer ${
                      lowStimulus 
                        ? 'bg-zinc-900 border-zinc-700 text-zinc-200' 
                        : card.color
                    }`}
                  >
                    {card.custom && (
                      <button
                        onClick={(e) => handleDeleteCard(e, activeCategory, card.id)}
                        className="absolute top-2 right-2 p-1.5 rounded-lg bg-slate-950/60 text-slate-400 hover:text-rose-400"
                        title="Excluir cartão"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <IconComponent className="w-9 h-9 mb-2.5 stroke-[1.75]" />
                    <span className="text-sm font-semibold tracking-wide leading-snug">
                      {card.label}
                    </span>
                    <span className="text-[11px] opacity-75 mt-1 line-clamp-2">
                      "{card.speech}"
                    </span>
                  </div>
                );
              })}
            </div>

            {showAddCardModal && (
              <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
                <div className="bg-slate-900 border border-slate-700 rounded-2xl p-5 w-full max-w-md space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-semibold text-slate-100">
                      Novo Cartão de Comunicação
                    </h3>
                    <button
                      onClick={() => setShowAddCardModal(false)}
                      className="p-1 text-slate-400 hover:text-slate-200"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <form onSubmit={handleAddCustomCard} className="space-y-3">
                    <div>
                      <label className="text-xs text-slate-400 block mb-1">
                        Título curto do cartão *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Ex: Quero comer pizza"
                        value={newCardLabel}
                        onChange={(e) => setNewCardLabel(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="text-xs text-slate-400 block mb-1">
                        Frase que o celular vai falar (opcional)
                      </label>
                      <input
                        type="text"
                        placeholder="Ex: Eu gostaria de comer pizza hoje"
                        value={newCardSpeech}
                        onChange={(e) => setNewCardSpeech(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="text-xs text-slate-400 block mb-1">
                        Categoria
                      </label>
                      <select
                        value={newCardCategory}
                        onChange={(e) => setNewCardCategory(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
                      >
                        <option value="meus_cartoes">Meus Cartões</option>
                        <option value="necessidades">Necessidades</option>
                        <option value="respostas">Respostas</option>
                        <option value="sensorial">Sensorial</option>
                      </select>
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setShowAddCardModal(false)}
                        className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-medium"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-medium"
                      >
                        Salvar Cartão
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </section>
        )}

        {activeTab === 'rotina' && (
          <section className="space-y-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
              <div className="flex justify-between items-center mb-2">
                <div>
                  <h2 className="text-base font-semibold text-slate-100">Rotina Previsível</h2>
                  <p className="text-xs text-slate-400">Toque na atividade para marcar como concluída</p>
                </div>
                <button
                  onClick={resetDayTasks}
                  className="flex items-center gap-1 text-xs text-slate-400 hover:text-indigo-300 bg-slate-950 border border-slate-800 px-2.5 py-1.5 rounded-xl"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Novo Dia</span>
                </button>
              </div>

              <div className="flex items-center justify-between text-xs text-indigo-300 mt-3 mb-1">
                <span>Progresso de hoje</span>
                <span className="font-bold">{completedCount} de {tasks.length} ({progressPercent}%)</span>
              </div>
              <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                <div 
                  className="h-full bg-indigo-500 rounded-full"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            <div className="space-y-2.5">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  onClick={() => toggleTask(task.id)}
                  className={`w-full flex items-center justify-between p-4 rounded-2xl border text-left cursor-pointer ${
                    task.done
                      ? 'bg-slate-900/40 border-slate-800/60 text-slate-500'
                      : 'bg-slate-900 border-slate-700/80 text-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-3.5 pr-2">
                    {task.done ? (
                      <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
                    ) : (
                      <Circle className="w-6 h-6 text-indigo-400 shrink-0" />
                    )}
                    <div>
                      <p className={`text-sm font-medium ${task.done ? 'line-through' : ''}`}>
                        {task.title}
                      </p>
                      <span className="text-xs text-slate-400 font-mono">
                        Horário: {task.time}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={(e) => deleteTask(e, task.id)}
                    className="p-2 text-slate-500 hover:text-rose-400 shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            <form onSubmit={addTask} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Adicionar atividade à rotina
              </h3>
              <div className="flex flex-col sm:flex-row gap-2.5">
                <input
                  type="text"
                  placeholder="Ex: Tomar remédio / Ler livro..."
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
                />
                <div className="flex gap-2">
                  <input
                    type="time"
                    value={newTaskTime}
                    onChange={(e) => setNewTaskTime(e.target.value)}
                    className="bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                  <button
                    type="submit"
                    className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 bg-indigo-600 active:bg-indigo-500 text-white font-medium px-4 py-2.5 rounded-xl text-sm"
                  >
                    <Plus className="w-4 h-4" />
                    Adicionar
                  </button>
                </div>
              </div>
            </form>
          </section>
        )}

        {activeTab === 'emocoes' && (
          <section className="space-y-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
              <h2 className="text-base font-semibold text-slate-100">Como está sua energia agora?</h2>
              <p className="text-xs text-slate-400 mt-1">
                Toque em uma opção para ouvir e receber sugestões de regulação.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                {emotions.map((emo) => {
                  const Icon = emo.icon;
                  const isSelected = selectedEmotion?.id === emo.id;
                  return (
                    <button
                      key={emo.id}
                      onClick={() => {
                        setSelectedEmotion(emo);
                        speak(`${emo.label}. ${emo.desc}`);
                      }}
                      className={`flex items-start gap-3.5 p-4 rounded-2xl border-2 text-left ${
                        lowStimulus
                          ? isSelected ? 'bg-zinc-800 border-zinc-400' : 'bg-zinc-900 border-zinc-800'
                          : isSelected ? emo.color : 'bg-slate-950/60 border-slate-800 text-slate-300'
                      }`}
                    >
                      <Icon className="w-7 h-7 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-sm">{emo.label}</p>
                        <p className="text-xs opacity-80 mt-0.5">{emo.desc}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {selectedEmotion && (
              <div className="bg-indigo-950/40 border border-indigo-700/50 rounded-2xl p-5">
                <span className="text-xs font-semibold uppercase tracking-wider text-indigo-300">
                  Plano de Apoio Sugerido
                </span>
                <p className="text-sm text-slate-200 mt-2 leading-relaxed">
                  {selectedEmotion.advice}
                </p>
              </div>
            )}
          </section>
        )}

        {activeTab === 'refugio' && (
          <section className="space-y-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col items-center text-center">
              <h2 className="text-base font-semibold text-slate-100">Respiração Guiada (4-4-4)</h2>
              <p className="text-xs text-slate-400 mt-1">
                Ajuda a desacelerar em momentos de ansiedade ou excesso de estímulos
              </p>

              <div className="my-7 relative flex items-center justify-center w-40 h-40">
                <div
                  className={`w-36 h-36 rounded-full border-2 border-indigo-400/40 bg-indigo-500/10 flex items-center justify-center ${
                    !lowStimulus && breathingActive ? 'transition-all duration-[4000ms] ease-in-out scale-110' : ''
                  }`}
                >
                  <span className="text-sm font-medium text-indigo-200 px-3">
                    {breathPhase}
                  </span>
                </div>
              </div>

              <button
                onClick={() => setBreathingActive(!breathingActive)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium ${
                  breathingActive
                    ? 'bg-slate-800 text-slate-200 border border-slate-700'
                    : 'bg-indigo-600 text-white'
                }`}
              >
                {breathingActive ? <Square className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                {breathingActive ? 'Pausar Respiração' : 'Iniciar Guia de Respiração'}
              </button>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-semibold text-slate-100">Conforto Acústico (Ruído Marrom)</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Frequência grave e contínua gerada pelo próprio aparelho (offline) para abafar sons externos.
                </p>
              </div>
              <button
                onClick={toggleBrownNoise}
                className={`w-full sm:w-auto shrink-0 flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-medium border ${
                  isPlayingNoise
                    ? 'bg-emerald-950/80 border-emerald-600 text-emerald-200'
                    : 'bg-slate-800 border-slate-700 text-slate-200'
                }`}
              >
                <Headphones className="w-4 h-4" />
                {isPlayingNoise ? 'Desligar Som' : 'Ativar Som Conforto'}
              </button>
            </div>
          </section>
        )}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 z-20 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 px-2 py-2">
        <div className="max-w-md mx-auto grid grid-cols-4 gap-1">
          {[
            { id: 'caa', label: 'Comunicar', icon: MessageSquare },
            { id: 'rotina', label: 'Rotina', icon: CalendarCheck },
            { id: 'emocoes', label: 'Emoções', icon: HeartHandshake },
            { id: 'refugio', label: 'Refúgio', icon: Sparkles },
          ].map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex flex-col items-center justify-center py-2 rounded-2xl ${
                  active
                    ? 'bg-indigo-500/20 text-indigo-300 font-semibold'
                    : 'text-slate-400'
                }`}
              >
                <Icon className="w-5 h-5 mb-1" />
                <span className="text-[11px]">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
