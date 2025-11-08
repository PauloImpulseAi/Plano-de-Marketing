import React, { useState, useCallback } from 'react';
import { editImage, fileToBase64 } from '../services/geminiService';
import Card from './ui/Card';
import Button from './ui/Button';
import Input from './ui/Input';
import Spinner from './ui/Spinner';
import { EditIcon } from './icons/EditIcon';

const ImageEditor: React.FC = () => {
  const [prompt, setPrompt] = useState<string>('');
  const [originalImage, setOriginalImage] = useState<{ file: File, url: string } | null>(null);
  const [editedImageUrl, setEditedImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setOriginalImage({ file, url: URL.createObjectURL(file) });
      setEditedImageUrl(null);
      setError(null);
    }
  };

  const handleEditImage = useCallback(async () => {
    if (!prompt.trim() || !originalImage) {
      setError('Por favor, envie uma imagem e forneça uma instrução de edição.');
      return;
    }
    setIsLoading(true);
    setError(null);
    setEditedImageUrl(null);

    try {
      const { base64, mimeType } = await fileToBase64(originalImage.file);
      const result = await editImage(prompt, base64, mimeType);
      if (result) {
        setEditedImageUrl(result);
      } else {
        setError('Falha ao editar a imagem. O prompt pode ter sido bloqueado ou a imagem não é suportada.');
      }
    } catch (e) {
      setError('Ocorreu um erro inesperado. Por favor, tente novamente.');
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, [prompt, originalImage]);

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-extrabold text-white sm:text-4xl">Editor de Imagens com IA</h2>
        <p className="mt-4 text-lg text-gray-400">Envie uma imagem e diga à IA o que você quer mudar.</p>
        <p className="mt-1 text-sm text-gray-500">Com Gemini 2.5 Flash Image.</p>
      </div>

      <Card>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="image-upload" className="block text-sm font-medium text-gray-300">Enviar Imagem</label>
              <Input
                id="image-upload"
                data-tour-id="editor-upload"
                type="file"
                accept="image/png, image/jpeg, image/webp"
                onChange={handleFileChange}
                className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                disabled={isLoading}
              />
            </div>
            <div>
              <label htmlFor="edit-prompt" className="block text-sm font-medium text-gray-300">Instrução para Edição</label>
              <Input
                id="edit-prompt"
                data-tour-id="editor-prompt"
                type="text"
                placeholder="Ex: Adicione um filtro retrô, deixe em preto e branco"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                disabled={isLoading || !originalImage}
              />
            </div>
          </div>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <Button onClick={handleEditImage} isLoading={isLoading} disabled={!prompt.trim() || !originalImage} className="w-full sm:w-auto">
            <EditIcon className="w-5 h-5 mr-2" />
            Aplicar Edição
          </Button>
        </div>
      </Card>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {originalImage && (
          <Card>
            <h3 className="text-xl font-bold mb-4 text-white">Original</h3>
            <img src={originalImage.url} alt="Original" className="rounded-lg w-full h-auto shadow-lg" />
          </Card>
        )}
        {(isLoading || editedImageUrl) && (
          <Card className="flex flex-col justify-center items-center">
            <h3 className="text-xl font-bold mb-4 text-white">Editada</h3>
            {isLoading && <Spinner />}
            {editedImageUrl && (
              <img src={editedImageUrl} alt={prompt} className="rounded-lg w-full h-auto shadow-lg" />
            )}
          </Card>
        )}
      </div>
    </div>
  );
};

export default ImageEditor;