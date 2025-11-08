import React, { useState, useCallback } from 'react';
import { generateImage } from '../services/geminiService';
import Card from './ui/Card';
import Button from './ui/Button';
import Input from './ui/Input';
import Spinner from './ui/Spinner';
import { ImageIcon } from './icons/ImageIcon';

const ImageGenerator: React.FC = () => {
  const [prompt, setPrompt] = useState<string>('');
  const [aspectRatio, setAspectRatio] = useState<string>('1:1');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerateImage = useCallback(async () => {
    if (!prompt.trim()) {
      setError('Por favor, digite um prompt.');
      return;
    }
    setIsLoading(true);
    setError(null);
    setImageUrl(null);

    try {
      const result = await generateImage(prompt, aspectRatio);
      if (result) {
        setImageUrl(result);
      } else {
        setError('Falha ao gerar a imagem. O prompt pode ter sido bloqueado.');
      }
    } catch (e) {
      setError('Ocorreu um erro inesperado. Por favor, tente novamente.');
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, [prompt, aspectRatio]);

  const aspectRatios = ['1:1', '16:9', '9:16', '4:3', '3:4'];

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-extrabold text-white sm:text-4xl">Gerador de Imagens com IA</h2>
        <p className="mt-4 text-lg text-gray-400">Dê vida às suas ideias. Descreva qualquer coisa que você possa imaginar.</p>
         <p className="mt-1 text-sm text-gray-500">Com Imagen 4 para resultados de alta qualidade.</p>
      </div>

      <Card>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label htmlFor="image-prompt" className="block text-sm font-medium text-gray-300">Prompt</label>
              <Input
                id="image-prompt"
                data-tour-id="generator-prompt"
                type="text"
                placeholder="Ex: Uma foto cinematográfica de um guaxinim em traje espacial em Marte"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <div>
              <label htmlFor="aspect-ratio" className="block text-sm font-medium text-gray-300">Proporção</label>
              <select
                id="aspect-ratio"
                value={aspectRatio}
                onChange={(e) => setAspectRatio(e.target.value)}
                disabled={isLoading}
                className="w-full bg-gray-700 border border-gray-600 text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5"
              >
                {aspectRatios.map(ar => <option key={ar} value={ar}>{ar}</option>)}
              </select>
            </div>
          </div>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <Button onClick={handleGenerateImage} isLoading={isLoading} disabled={!prompt.trim()} className="w-full sm:w-auto" data-tour-id="generator-button">
            <ImageIcon className="w-5 h-5 mr-2" />
            Gerar Imagem
          </Button>
        </div>
      </Card>
      
      {(isLoading || imageUrl) && (
        <Card className="flex justify-center items-center">
          {isLoading && <Spinner />}
          {imageUrl && (
            <img src={imageUrl} alt={prompt} className="rounded-lg max-w-full max-h-[70vh] shadow-lg" />
          )}
        </Card>
      )}
    </div>
  );
};

export default ImageGenerator;