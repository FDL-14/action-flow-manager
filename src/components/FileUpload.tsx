
import React, { useState } from 'react';
import { UploadCloud, X, FileIcon, FileText, FileImage } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FileUploadProps {
  onFilesChange: (files: File[]) => void;
  maxFiles?: number;
  maxSize?: number; // in bytes
  acceptedFileTypes?: string[];
}

const FileUpload = ({ 
  onFilesChange, 
  maxFiles = 5, 
  maxSize = 5242880, // 5MB by default
  acceptedFileTypes = ['.png', '.jpg', '.jpeg', '.pdf', '.docx', '.xlsx'] 
}: FileUploadProps) => {
  const [files, setFiles] = useState<File[]>([]);
  const [isDragActive, setIsDragActive] = useState(false);
  
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles) return;
    
    // Check for file limit
    if (files.length + selectedFiles.length > maxFiles) {
      alert(`Você só pode enviar até ${maxFiles} arquivos.`);
      return;
    }

    // Filter files by size
    const validFiles = Array.from(selectedFiles).filter(file => file.size <= maxSize);
    
    // Alert if any files were rejected due to size
    if (validFiles.length < selectedFiles.length) {
      alert(`Alguns arquivos excedem o tamanho máximo de ${Math.round(maxSize / 1048576)}MB.`);
    }

    const newFiles = [...files, ...validFiles];
    setFiles(newFiles);
    onFilesChange(newFiles);
    
    // Reset the input value so selecting the same file again works
    e.target.value = "";
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(true);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    
    const droppedFiles = e.dataTransfer.files;
    if (!droppedFiles) return;
    
    // Check for file limit
    if (files.length + droppedFiles.length > maxFiles) {
      alert(`Você só pode enviar até ${maxFiles} arquivos.`);
      return;
    }

    // Filter files by size and type
    const validFiles = Array.from(droppedFiles).filter(file => {
      const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
      const isValidType = acceptedFileTypes.includes(fileExtension) || acceptedFileTypes.includes(file.type);
      return file.size <= maxSize && isValidType;
    });
    
    // Alert if any files were rejected
    if (validFiles.length < droppedFiles.length) {
      alert(`Alguns arquivos foram rejeitados devido ao tamanho ou tipo incompatível.`);
    }

    const newFiles = [...files, ...validFiles];
    setFiles(newFiles);
    onFilesChange(newFiles);
  };

  const removeFile = (index: number) => {
    const newFiles = [...files];
    newFiles.splice(index, 1);
    setFiles(newFiles);
    onFilesChange(newFiles);
  };

  const getFileIcon = (file: File) => {
    const type = file.type;
    if (type.startsWith('image/')) {
      return <FileImage className="h-4 w-4 mr-2" />;
    } else if (type.includes('pdf')) {
      return <FileText className="h-4 w-4 mr-2" />;
    } else {
      return <FileIcon className="h-4 w-4 mr-2" />;
    }
  };

  return (
    <div className="space-y-3">
      <div 
        className={`border-2 border-dashed rounded-md p-6 cursor-pointer text-center 
        ${isDragActive ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}`}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => document.getElementById('file-input')?.click()}
      >
        <input 
          id="file-input"
          type="file" 
          multiple 
          accept={acceptedFileTypes.join(',')}
          onChange={handleFileSelect}
          className="hidden" 
        />
        <div className="flex flex-col items-center space-y-2">
          <UploadCloud className="h-8 w-8 text-gray-400" />
          <p className="text-sm font-medium">
            {isDragActive
              ? 'Solte os arquivos aqui...'
              : 'Arraste e solte arquivos aqui, ou clique para selecionar'
            }
          </p>
          <p className="text-xs text-gray-500">
            Formatos suportados: {acceptedFileTypes.join(', ')}
          </p>
        </div>
      </div>

      {files.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium">Arquivos selecionados ({files.length}/{maxFiles}):</p>
          <div className="space-y-2">
            {files.map((file, index) => (
              <div key={index} className="flex items-center justify-between bg-gray-50 rounded px-3 py-2">
                <div className="flex items-center overflow-hidden">
                  {getFileIcon(file)}
                  <span className="text-sm truncate">{file.name}</span>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-6 w-6 p-0 rounded-full" 
                  onClick={() => removeFile(index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default FileUpload;
