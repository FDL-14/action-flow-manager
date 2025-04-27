
import React from 'react';
import { Button } from '@/components/ui/button';
import { Upload, X } from 'lucide-react';
import { FormLabel } from '@/components/ui/form';

interface LogoUploadProps {
  logoPreview: string | null;
  onLogoChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveLogo: () => void;
}

const LogoUpload: React.FC<LogoUploadProps> = ({
  logoPreview,
  onLogoChange,
  onRemoveLogo,
}) => {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onLogoChange(e);
    }
  };

  return (
    <div>
      <div className="mt-2 flex flex-col items-center">
        {logoPreview ? (
          <div className="relative w-40 h-40 mb-4">
            <img
              src={logoPreview}
              alt="Logo Preview"
              className="w-full h-full object-contain"
            />
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute top-0 right-0 h-6 w-6"
              onClick={onRemoveLogo}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className="border-2 border-dashed rounded-md p-8 mb-4 flex flex-col items-center justify-center">
            <Upload className="h-10 w-10 text-gray-400 mb-2" />
            <p className="text-sm text-gray-500">Nenhuma logo selecionada</p>
          </div>
        )}
        
        <input
          type="file"
          id="logo-upload"
          className="hidden"
          accept="image/*"
          onChange={handleFileChange}
        />
        <label htmlFor="logo-upload">
          <Button type="button" variant="outline" asChild>
            <span>
              <Upload className="h-4 w-4 mr-2" />
              Selecionar logo
            </span>
          </Button>
        </label>
      </div>
    </div>
  );
};

export default LogoUpload;
