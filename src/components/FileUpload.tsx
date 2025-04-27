
import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
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

  const onDrop = useCallback((acceptedFiles: File[]) => {
    // Check for file limit
    if (files.length + acceptedFiles.length > maxFiles) {
      alert(`Você só pode enviar até ${maxFiles} arquivos.`);
      return;
    }

    // Filter files by size
    const validFiles = acceptedFiles.filter(file => file.size <= maxSize);
    
    // Alert if any files were rejected due to size
    if (validFiles.length < acceptedFiles.length) {
      alert(`Alguns arquivos excedem o tamanho máximo de ${Math.round(maxSize / 1048576)}MB.`);
    }

    const newFiles = [...files, ...validFiles];
    setFiles(newFiles);
    onFilesChange(newFiles);
  }, [files, maxFiles, maxSize, onFilesChange]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: acceptedFileTypes.reduce((acc, type) => {
      let mimeType: string;
      switch (type) {
        case '.png': mimeType = 'image/png'; break;
        case '.jpg':
        case '.jpeg': mimeType = 'image/jpeg'; break;
        case '.pdf': mimeType = 'application/pdf'; break;
        case '.docx': mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'; break;
        case '.xlsx': mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'; break;
        default: mimeType = type;
      }
      return { ...acc, [mimeType]: [] };
    }, {}),
    maxSize
  });

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
        {...getRootProps()} 
        className={`border-2 border-dashed rounded-md p-6 cursor-pointer text-center 
        ${isDragActive ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}`}
      >
        <input {...getInputProps()} />
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
