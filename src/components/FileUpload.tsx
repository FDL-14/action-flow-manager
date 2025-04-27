
import React, { useCallback, useState } from 'react';
import { UploadCloud, X, FileIcon, FileText, FileImage } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FileUploadProps {
  onFilesChange: (files: File[]) => void;
  maxFiles?: number;
  maxSize?: number;
  acceptedFileTypes?: string[];
}

const FileUpload: React.FC<FileUploadProps> = ({
  onFilesChange,
  maxFiles = 5,
  maxSize = 5 * 1024 * 1024, // 5MB default
  acceptedFileTypes = ['.png', '.jpg', '.jpeg', '.pdf', '.docx', '.xlsx']
}) => {
  const [files, setFiles] = useState<File[]>([]);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    
    const droppedFiles = Array.from(e.dataTransfer.files);
    
    // Check for file limit
    if (files.length + droppedFiles.length > maxFiles) {
      alert(`Você só pode enviar até ${maxFiles} arquivos.`);
      return;
    }
    
    // Filter files by size and type
    const validFiles = droppedFiles.filter(file => {
      // Check file size
      if (file.size > maxSize) {
        return false;
      }
      
      // Check file type if acceptedFileTypes is provided
      if (acceptedFileTypes && acceptedFileTypes.length > 0) {
        const fileExtension = `.${file.name.split('.').pop()?.toLowerCase()}`;
        return acceptedFileTypes.some(type => 
          type === fileExtension || 
          file.type.includes(type.replace('.', ''))
        );
      }
      
      return true;
    });
    
    // Alert if any files were rejected due to size
    if (validFiles.length < droppedFiles.length) {
      alert(`Alguns arquivos excedem o tamanho máximo de ${Math.round(maxSize / 1048576)}MB ou não são do formato aceito.`);
    }
    
    const newFiles = [...files, ...validFiles];
    setFiles(newFiles);
    onFilesChange(newFiles);
  }, [files, maxFiles, maxSize, acceptedFileTypes, onFilesChange]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      
      // Check for file limit
      if (files.length + selectedFiles.length > maxFiles) {
        alert(`Você só pode enviar até ${maxFiles} arquivos.`);
        return;
      }
      
      // Filter files by size and type
      const validFiles = selectedFiles.filter(file => {
        // Check file size
        if (file.size > maxSize) {
          return false;
        }
        
        // Check file type if acceptedFileTypes is provided
        if (acceptedFileTypes && acceptedFileTypes.length > 0) {
          const fileExtension = `.${file.name.split('.').pop()?.toLowerCase()}`;
          return acceptedFileTypes.some(type => 
            type === fileExtension || 
            file.type.includes(type.replace('.', ''))
          );
        }
        
        return true;
      });
      
      // Alert if any files were rejected due to size or type
      if (validFiles.length < selectedFiles.length) {
        alert(`Alguns arquivos excedem o tamanho máximo de ${Math.round(maxSize / 1048576)}MB ou não são do formato aceito.`);
      }
      
      const newFiles = [...files, ...validFiles];
      setFiles(newFiles);
      onFilesChange(newFiles);
    }
  };
  
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
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
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        className={`border-2 border-dashed rounded-md p-6 cursor-pointer text-center`}
      >
        <input
          type="file"
          id="file-upload"
          className="hidden"
          onChange={handleChange}
          multiple
          accept={acceptedFileTypes.join(',')}
        />
        <label htmlFor="file-upload" className="cursor-pointer w-full h-full block">
          <div className="flex flex-col items-center space-y-2">
            <UploadCloud className="h-8 w-8 text-gray-400" />
            <p className="text-sm font-medium">
              Arraste e solte arquivos aqui, ou clique para selecionar
            </p>
            <p className="text-xs text-gray-500">
              Formatos suportados: {acceptedFileTypes.join(', ')}
            </p>
          </div>
        </label>
      </div>
      
      {files.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium">
            Arquivos selecionados ({files.length}/{maxFiles}):
          </p>
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
