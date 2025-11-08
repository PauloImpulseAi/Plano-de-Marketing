import React, { useState, useCallback, useRef } from 'react';
import { generateMarketingPlan, fileToBase64, summarizeServices, generateQuote } from '../services/geminiService';
import Card from './ui/Card';
import Button from './ui/Button';
import Spinner from './ui/Spinner';
import Input from './ui/Input';
import { SparklesIcon } from './icons/SparklesIcon';

declare const jspdf: any;
declare const marked: any;

const MarketingPlanner: React.FC = () => {
  const [idea, setIdea] = useState<string>('');
  const [plan, setPlan] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [logo, setLogo] = useState<{ file: File, url: string } | null>(null);
  const [copyButtonText, setCopyButtonText] = useState('Copiar Texto');
  const [summary, setSummary] = useState<string>('');
  const [isSummarizing, setIsSummarizing] = useState<boolean>(false);
  const [copySummaryButtonText, setCopySummaryButtonText] = useState('Copiar Resumo');
  const [companyName, setCompanyName] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [quote, setQuote] = useState<string>('');
  const [isQuoting, setIsQuoting] = useState<boolean>(false);
  const [copyQuoteButtonText, setCopyQuoteButtonText] = useState('Copiar Texto');
  const planContentRef = useRef<HTMLDivElement>(null);
  const summaryContentRef = useRef<HTMLDivElement>(null);
  const quoteContentRef = useRef<HTMLDivElement>(null);


  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogo({ file, url: URL.createObjectURL(file) });
    }
  };

  const handleGeneratePlan = useCallback(async () => {
    if (!idea.trim()) {
      setError('Por favor, insira sua ideia de negócio.');
      return;
    }
    setIsLoading(true);
    setError(null);
    setPlan('');
    setSummary('');
    setQuote('');

    try {
      const result = await generateMarketingPlan(idea);
      const htmlPlan = marked.parse(result);
      setPlan(htmlPlan);
    } catch (e) {
      setError('Falha ao gerar o plano de marketing. Por favor, tente novamente.');
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, [idea]);
  
  const generatePdfFromHtmlContent = async (
    title: string,
    contentElement: HTMLDivElement,
    logoFile: File | null
  ) => {
    const { jsPDF } = jspdf;
    const doc = new jsPDF({
      orientation: 'p',
      unit: 'pt',
      format: 'a4',
    });

    const margin = 40;
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let y = margin;

    if (logoFile) {
      try {
        const { base64, mimeType } = await fileToBase64(logoFile);
        const imgProps = doc.getImageProperties(`data:${mimeType};base64,${base64}`);
        const logoWidth = 70;
        const logoHeight = (imgProps.height * logoWidth) / imgProps.width;
        doc.addImage(`data:${mimeType};base64,${base64}`, mimeType.split('/')[1].toUpperCase(), margin, y, logoWidth, logoHeight);
      } catch (err) {
        console.error("Error adding logo:", err);
      }
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.setTextColor('#1A202C');
    const titleY = logoFile ? y + 30 : y;
    doc.text(title, pageWidth / 2, titleY, { align: 'center' });
    y = titleY + 50;
    
    const checkPageBreak = (neededHeight: number) => {
      if (y + neededHeight > pageHeight - margin) {
        doc.addPage();
        y = margin;
      }
    };
    
    const processNode = (node: ChildNode) => {
      const text = (node as HTMLElement).innerText?.trim();
      if (!text) return;

      const commonFontSize = 11;
      const commonLineHeight = commonFontSize * 1.35;
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(commonFontSize);
      doc.setTextColor('#4A5568');

      switch (node.nodeName) {
        case 'H1': case 'H2': case 'H3': case 'H4': case 'H5': case 'H6':
          const level = parseInt(node.nodeName.substring(1));
          const fontSize = Math.max(12, 20 - (level - 1) * 2);
          const lineHeight = fontSize * 1.2;
          checkPageBreak(lineHeight * 2);
          y += 15;
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(fontSize);
          doc.setTextColor('#2D3748');
          const lines = doc.splitTextToSize(text, pageWidth - margin * 2);
          doc.text(lines, margin, y);
          y += lines.length * (lineHeight) + 5;
          break;

        case 'P':
          const pLines = doc.splitTextToSize(text, pageWidth - margin * 2);
          checkPageBreak(pLines.length * commonLineHeight);
          doc.text(pLines, margin, y);
          y += (pLines.length * commonLineHeight) + 10;
          break;

        case 'UL': case 'OL':
          y += 5;
          Array.from(node.childNodes).forEach((liNode, index) => {
            if (liNode.nodeName !== 'LI') return;
            const liText = (liNode as HTMLElement).innerText;
            const prefix = node.nodeName === 'UL' ? '•  ' : `${index + 1}.  `;
            const contentWidth = pageWidth - margin * 2 - 25;
            const liLines = doc.splitTextToSize(liText, contentWidth);
            
            checkPageBreak((liLines.length * commonLineHeight) + 5);
            
            doc.text(prefix + liLines[0], margin + 15, y);
            if(liLines.length > 1) {
              doc.text(liLines.slice(1), margin + 15 + doc.getTextWidth(prefix), y + commonLineHeight);
            }
            y += (liLines.length * commonLineHeight) + 4; // space between list items
          });
          y += 10;
          break;

        default:
          const defaultLines = doc.splitTextToSize(text, pageWidth - margin * 2);
          checkPageBreak(defaultLines.length * commonLineHeight);
          doc.text(defaultLines, margin, y);
          y += (defaultLines.length * commonLineHeight) + 10;
          break;
      }
    };
    
    const contentContainer = contentElement.querySelector('.prose');
    if (contentContainer) {
        contentContainer.childNodes.forEach(processNode);
    } else {
        contentElement.childNodes.forEach(processNode);
    }
    
    return doc;
  };

  const handleDownloadPdf = async () => {
    if (!planContentRef.current) return;
    try {
      const doc = await generatePdfFromHtmlContent(
        'Plano de Marketing Personalizado',
        planContentRef.current,
        logo ? logo.file : null
      );
      doc.save('plano-de-marketing.pdf');
    } catch (e) {
      console.error("Erro ao gerar PDF do plano:", e);
    }
  };
  
  const handleDownloadSummaryPdf = async () => {
    if (!summaryContentRef.current) return;
    try {
      const doc = await generatePdfFromHtmlContent(
        'Resumo de Serviços Executáveis',
        summaryContentRef.current,
        logo ? logo.file : null
      );
      doc.save('resumo-de-servicos.pdf');
    } catch (e) {
      console.error("Erro ao gerar PDF do resumo:", e);
    }
  };
  
  const handleDownloadQuotePdf = async () => {
    if (!quoteContentRef.current) return;
    try {
      const doc = await generatePdfFromHtmlContent(
        'Proposta de Orçamento',
        quoteContentRef.current,
        logo ? logo.file : null
      );
      doc.save('proposta-orcamento.pdf');
    } catch (e) {
      console.error("Erro ao gerar PDF do orçamento:", e);
    }
  };

  const handleCopyText = () => {
    if (planContentRef.current) {
      navigator.clipboard.writeText(planContentRef.current.innerText)
        .then(() => {
          setCopyButtonText('Copiado!');
          setTimeout(() => setCopyButtonText('Copiar Texto'), 2000);
        })
        .catch(err => console.error("Falha ao copiar texto: ", err));
    }
  };
  
  const handleCopySummary = () => {
    if (summaryContentRef.current) {
      navigator.clipboard.writeText(summaryContentRef.current.innerText)
        .then(() => {
          setCopySummaryButtonText('Copiado!');
          setTimeout(() => setCopySummaryButtonText('Copiar Resumo'), 2000);
        })
        .catch(err => console.error("Falha ao copiar resumo: ", err));
    }
  };
  
  const handleCopyQuote = () => {
    if (quoteContentRef.current) {
      navigator.clipboard.writeText(quoteContentRef.current.innerText)
        .then(() => {
          setCopyQuoteButtonText('Copiado!');
          setTimeout(() => setCopyQuoteButtonText('Copiar Texto'), 2000);
        })
        .catch(err => console.error("Falha ao copiar orçamento: ", err));
    }
  };

  const handleSummarize = async () => {
    if (!planContentRef.current?.innerText) return;
    
    setIsSummarizing(true);
    setSummary('');
    try {
        const result = await summarizeServices(planContentRef.current.innerText);
        const htmlSummary = marked.parse(result);
        setSummary(htmlSummary);
    } catch(e) {
        setSummary('<p class="text-red-400">Ocorreu um erro ao gerar o resumo.</p>');
        console.error(e);
    } finally {
        setIsSummarizing(false);
    }
  };

  const handleGenerateQuote = async () => {
    if (!planContentRef.current?.innerText || !companyName.trim()) {
        setError('Por favor, preencha o nome da empresa para gerar o orçamento.');
        return;
    }
    
    setIsQuoting(true);
    setQuote('');
    setError(null);
    try {
        const result = await generateQuote(planContentRef.current.innerText, companyName, phone);
        const htmlQuote = marked.parse(result);
        setQuote(htmlQuote);
    } catch(e) {
        setQuote('<p class="text-red-400">Ocorreu um erro ao gerar o orçamento.</p>');
        console.error(e);
    } finally {
        setIsQuoting(false);
    }
};


  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-extrabold text-white sm:text-4xl">Planejador de Marketing com IA</h2>
        <p className="mt-4 text-lg text-gray-400">Transforme sua ideia em uma estratégia de marketing completa e profissional.</p>
        <p className="mt-1 text-sm text-gray-500">Com Gemini 2.5 Pro para análises complexas.</p>
      </div>
      
      <Card data-tour-id="logo-upload">
        <h3 className="text-lg font-bold mb-3">1. Adicione seu Logotipo (Opcional)</h3>
        <div className="flex items-center gap-4">
            <input
                type="file"
                accept="image/png, image/jpeg"
                onChange={handleLogoChange}
                className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            {logo && <img src={logo.url} alt="Logo preview" className="h-12 w-12 object-contain rounded-md bg-white p-1" />}
        </div>
      </Card>

      <Card>
         <h3 className="text-lg font-bold mb-3">2. Descreva sua Ideia de Negócio</h3>
        <div className="space-y-4">
          <textarea
            id="business-idea"
            data-tour-id="marketing-input"
            rows={5}
            className="w-full bg-gray-700 border border-gray-600 text-white placeholder-gray-400 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5"
            placeholder="Ex: Uma caixa de assinatura ecológica para animais de estimação, com brinquedos e petiscos naturais..."
            value={idea}
            onChange={(e) => setIdea(e.target.value)}
            disabled={isLoading}
          />
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <Button onClick={handleGeneratePlan} isLoading={isLoading} disabled={!idea.trim()} className="w-full sm:w-auto" data-tour-id="marketing-button">
            <SparklesIcon className="w-5 h-5 mr-2"/>
            Gerar Plano
          </Button>
        </div>
      </Card>
      
      {(isLoading || plan) && (
        <Card>
          <div className="flex flex-wrap gap-4 justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-white">Seu Plano de Marketing Personalizado</h3>
            {plan && !isLoading && (
              <div className="flex gap-2">
                <Button onClick={handleCopyText} variant="secondary">{copyButtonText}</Button>
                <Button onClick={handleDownloadPdf} variant="secondary">Baixar PDF</Button>
              </div>
            )}
          </div>
          {isLoading && <Spinner />}
          {plan && (
             <div ref={planContentRef} className="p-4 bg-gray-800 rounded-md">
                <div className="prose prose-invert prose-sm sm:prose-base max-w-none text-gray-300 font-sans" dangerouslySetInnerHTML={{ __html: plan }}>
                </div>
            </div>
          )}
        </Card>
      )}

      {plan && !isLoading && (
         <Card>
            <h3 className="text-xl font-bold text-white mb-4">Próximos Passos</h3>
            {!summary && !isSummarizing && (
              <>
                <p className="text-gray-400 mb-4 text-sm">Peça à IA para extrair uma lista de tarefas do plano gerado.</p>
                <Button onClick={handleSummarize} isLoading={isSummarizing}>
                    <SparklesIcon className="w-5 h-5 mr-2"/>
                    Resumir Serviços Executáveis
                </Button>
              </>
            )}
            
            {(isSummarizing || summary) && (
                <div className="mt-4 border-t border-gray-700 pt-4">
                    {summary && !isSummarizing && (
                       <div className="flex gap-2 mb-4">
                         <Button onClick={handleCopySummary} variant="secondary">{copySummaryButtonText}</Button>
                         <Button onClick={handleDownloadSummaryPdf} variant="secondary">Baixar Resumo em PDF</Button>
                       </div>
                    )}
                    {isSummarizing && <Spinner size="sm" />}
                    {summary && (
                         <div ref={summaryContentRef} className="prose prose-invert prose-sm sm:prose-base max-w-none text-gray-300 font-sans" dangerouslySetInnerHTML={{ __html: summary }} />
                    )}
                </div>
            )}
        </Card>
      )}

      {summary && !isSummarizing && (
        <Card>
            <h3 className="text-xl font-bold text-white mb-4">3. Gerar Orçamento</h3>
            <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="company-name" className="block text-sm font-medium text-gray-300">Nome da Empresa</label>
                        <Input id="company-name" type="text" placeholder="Sua Empresa Ltda." value={companyName} onChange={(e) => setCompanyName(e.target.value)} disabled={isQuoting} />
                    </div>
                    <div>
                        <label htmlFor="phone" className="block text-sm font-medium text-gray-300">Telefone (Opcional)</label>
                        <Input id="phone" type="text" placeholder="(XX) XXXXX-XXXX" value={phone} onChange={(e) => setPhone(e.target.value)} disabled={isQuoting} />
                    </div>
                </div>
                <Button onClick={handleGenerateQuote} isLoading={isQuoting} disabled={!companyName.trim()}>
                    <SparklesIcon className="w-5 h-5 mr-2"/>
                    Gerar Orçamento
                </Button>
            </div>

            {(isQuoting || quote) && (
                <div className="mt-6 border-t border-gray-700 pt-6">
                    <div className="flex flex-wrap gap-4 justify-between items-center mb-4">
                        <h3 className="text-xl font-bold text-white">Sua Proposta de Orçamento</h3>
                        {quote && !isQuoting && (
                          <div className="flex gap-2">
                            <Button onClick={handleCopyQuote} variant="secondary">{copyQuoteButtonText}</Button>
                            <Button onClick={handleDownloadQuotePdf} variant="secondary">Baixar PDF</Button>
                          </div>
                        )}
                    </div>
                    {isQuoting && <Spinner />}
                    {quote && (
                         <div ref={quoteContentRef} className="p-4 bg-gray-800 rounded-md">
                            <div className="prose prose-invert prose-sm sm:prose-base max-w-none text-gray-300 font-sans" dangerouslySetInnerHTML={{ __html: quote }}>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </Card>
      )}
    </div>
  );
};

export default MarketingPlanner;