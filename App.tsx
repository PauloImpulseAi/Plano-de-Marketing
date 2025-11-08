import React, { useState, useCallback, useEffect } from 'react';
import MarketingPlanner from './components/MarketingPlanner';
import ChatBot from './components/ChatBot';
import Tour from './components/Tour';
import { SparklesIcon } from './components/icons/SparklesIcon';
import { ChatIcon } from './components/icons/ChatIcon';
import { AppFeature, TourStep } from './types';
import Button from './components/ui/Button';

const App: React.FC = () => {
  const [activeFeature, setActiveFeature] = useState<AppFeature>(AppFeature.MarketingPlanner);
  const [isTourActive, setIsTourActive] = useState(false);
  const [tourStepIndex, setTourStepIndex] = useState(0);

  useEffect(() => {
    const tourCompleted = localStorage.getItem('app_tour_completed');
    if (!tourCompleted) {
      setIsTourActive(true);
    }
  }, []);

  const handleCloseTour = () => {
    setIsTourActive(false);
    localStorage.setItem('app_tour_completed', 'true');
    setTourStepIndex(0);
    setActiveFeature(AppFeature.MarketingPlanner);
  };
  
  const startTour = () => {
    setTourStepIndex(0);
    setActiveFeature(AppFeature.MarketingPlanner);
    setIsTourActive(true);
  }

  const tourSteps: TourStep[] = [
    {
      target: 'body',
      position: 'center',
      title: 'Bem-vindo(a) ao AI Suite!',
      content: 'Vamos fazer um tour rápido para mostrar como você pode usar o poder da IA para suas tarefas de marketing.',
    },
    {
      target: '[data-tour-id="sidebar-nav"]',
      position: 'right',
      title: 'Navegação Principal',
      content: 'Aqui você pode alternar entre o Planejador de Marketing e o nosso Chat com IA.',
    },
    {
      target: '[data-tour-id="marketing-nav"]',
      position: 'right',
      title: 'Planejador de Marketing',
      content: 'Esta é a ferramenta principal. Ela usa o Gemini 2.5 Pro para criar planos de marketing detalhados.',
      action: () => setActiveFeature(AppFeature.MarketingPlanner),
    },
     {
      target: '[data-tour-id="logo-upload"]',
      position: 'bottom',
      title: 'Adicione seu Logo',
      content: 'Comece fazendo o upload do seu logotipo. Ele será incluído no documento PDF que você poderá baixar.',
    },
    {
      target: '[data-tour-id="marketing-input"]',
      position: 'bottom',
      title: 'Sua Ideia',
      content: 'Digite sua ideia de negócio aqui. Quanto mais detalhes você fornecer, melhor será o plano gerado.',
    },
    {
      target: '[data-tour-id="marketing-button"]',
      position: 'bottom',
      title: 'Gerar Plano',
      content: 'Clique aqui para que a IA crie uma estratégia completa. Depois, você poderá baixá-la em PDF.',
    },
    {
      target: '[data-tour-id="chat-nav"]',
      position: 'right',
      title: 'Chat com IA',
      content: 'Precisa de uma resposta rápida? Converse com nosso assistente de IA para tirar dúvidas ou pedir sugestões.',
      action: () => setActiveFeature(AppFeature.ChatBot),
    },
     {
      target: '[data-tour-id="chat-input"]',
      position: 'top',
      title: 'Converse Aqui',
      content: 'Digite sua pergunta ou mensagem e nosso assistente, com Gemini 2.5 Flash, responderá rapidamente.',
    },
     {
      target: 'body',
      position: 'center',
      title: 'Tour Concluído!',
      content: 'Você está pronto para explorar todo o potencial do AI Suite. Aproveite!',
    },
  ];

  const renderFeature = useCallback(() => {
    switch (activeFeature) {
      case AppFeature.MarketingPlanner:
        return <MarketingPlanner />;
      case AppFeature.ChatBot:
        return <ChatBot />;
      default:
        return <MarketingPlanner />;
    }
  }, [activeFeature]);

  const NavButton: React.FC<{
    feature: AppFeature;
    label: string;
    icon: React.ReactNode;
    tourId: string;
  }> = ({ feature, label, icon, tourId }) => (
    <button
      onClick={() => setActiveFeature(feature)}
      data-tour-id={tourId}
      className={`flex items-center justify-start gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors duration-200 w-full ${
        activeFeature === feature
          ? 'bg-blue-600 text-white'
          : 'text-gray-300 hover:bg-gray-700 hover:text-white'
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-gray-900 text-gray-100">
       {isTourActive && (
        <Tour
          steps={tourSteps}
          stepIndex={tourStepIndex}
          setStepIndex={setTourStepIndex}
          onClose={handleCloseTour}
        />
      )}
      <aside className="w-full md:w-64 bg-gray-800 p-4 shadow-lg flex-shrink-0 flex flex-col">
        <div className="mb-8 flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-lg">
             <SparklesIcon className="w-6 h-6 text-white"/>
          </div>
          <h1 className="text-xl font-bold text-white">AI Suite</h1>
        </div>
        <nav className="flex flex-row md:flex-col gap-2" data-tour-id="sidebar-nav">
          <NavButton tourId="marketing-nav" feature={AppFeature.MarketingPlanner} label="Marketing" icon={<SparklesIcon className="w-5 h-5" />} />
          <NavButton tourId="chat-nav" feature={AppFeature.ChatBot} label="Chat AI" icon={<ChatIcon className="w-5 h-5" />} />
        </nav>
        <div className="mt-auto pt-4 border-t border-gray-700">
           <Button onClick={startTour} variant="secondary" className="w-full">Fazer Tour</Button>
        </div>
      </aside>
      <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
        {renderFeature()}
      </main>
    </div>
  );
};

export default App;