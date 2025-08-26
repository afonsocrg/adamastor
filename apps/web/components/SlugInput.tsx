"use client";

import { useState, useEffect, useRef } from 'react';
import { useDebounce } from 'use-debounce';
import { Input } from '@/components/tailwind/ui/input';
import { generateSlug, isValidSlug } from '@/lib/slug-utils';
import { Check, X, Loader2, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SlugInputProps {
  value: string;
  onChange: (value: string) => void;
  title?: string;
  excludeId?: string;
  disabled?: boolean;
  id?: string;
  placeholder?: string;
}

type ValidationState = 'idle' | 'checking' | 'valid' | 'taken' | 'invalid';

export function SlugInput({ 
  value, 
  onChange, 
  title = '', 
  excludeId, 
  disabled = false,
  id,
  placeholder = "url-slug"
}: SlugInputProps) {
  const [localValue, setLocalValue] = useState(value);
  const [validationState, setValidationState] = useState<ValidationState>('idle');
  const [validationMessage, setValidationMessage] = useState('');
  const [debouncedValue] = useDebounce(localValue, 500);
  const [debouncedTitle] = useDebounce(title, 500);
  const hasUserEditedSlug = useRef(false);

  // Auto-generate slug from title when user hasn't manually edited the slug
  useEffect(() => {
    if (title && !hasUserEditedSlug.current && !localValue) {
      const generatedSlug = generateSlug(debouncedTitle);
      setLocalValue(generatedSlug);
    }
  }, [debouncedTitle, localValue, title]);

  // Validate slug when it changes
  useEffect(() => {
    if (!debouncedValue) {
      setValidationState('idle');
      setValidationMessage('');
      onChange('');
      return;
    }

    // Check format first
    if (!isValidSlug(debouncedValue)) {
      setValidationState('invalid');
      setValidationMessage('Slug can only contain lowercase letters, numbers, and hyphens');
      onChange(debouncedValue);
      return;
    }

    // Check uniqueness
    setValidationState('checking');
    checkSlugUniqueness(debouncedValue, excludeId)
      .then((isUnique) => {
        if (isUnique) {
          setValidationState('valid');
          setValidationMessage('Slug is available');
        } else {
          setValidationState('taken');
          setValidationMessage('This slug is already taken');
        }
        onChange(debouncedValue);
      })
      .catch((error) => {
        console.error('Error checking slug uniqueness:', error);
        setValidationState('invalid');
        setValidationMessage('Error checking slug availability');
        onChange(debouncedValue);
      });
  }, [debouncedValue, excludeId, onChange]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    hasUserEditedSlug.current = true;
    setLocalValue(newValue);
  };

  const getValidationIcon = () => {
    switch (validationState) {
      case 'checking':
        return <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />;
      case 'valid':
        return <Check className="h-4 w-4 text-green-500" />;
      case 'taken':
        return <X className="h-4 w-4 text-red-500" />;
      case 'invalid':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      default:
        return null;
    }
  };

  const getInputClassName = () => {
    const baseClasses = "pr-10";
    switch (validationState) {
      case 'valid':
        return cn(baseClasses, "border-green-500 focus-visible:ring-green-500");
      case 'taken':
      case 'invalid':
        return cn(baseClasses, "border-red-500 focus-visible:ring-red-500");
      case 'checking':
        return cn(baseClasses, "border-blue-500 focus-visible:ring-blue-500");
      default:
        return baseClasses;
    }
  };

  return (
    <div className="space-y-2">
      <div className="relative">
        <Input
          id={id}
          value={localValue}
          onChange={handleInputChange}
          placeholder={placeholder}
          disabled={disabled}
          className={getInputClassName()}
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          {getValidationIcon()}
        </div>
      </div>
      
      {validationMessage && (
        <p className={cn(
          "text-sm",
          validationState === 'valid' && "text-green-600",
          validationState === 'taken' && "text-red-600", 
          validationState === 'invalid' && "text-yellow-600",
          validationState === 'checking' && "text-blue-600"
        )}>
          {validationMessage}
        </p>
      )}
    </div>
  );
}

// Helper function to check slug uniqueness via API
async function checkSlugUniqueness(slug: string, excludeId?: string): Promise<boolean> {
  const params = new URLSearchParams({ slug });
  if (excludeId) {
    params.append('excludeId', excludeId);
  }
  
  const response = await fetch(`/api/slugs/validate?${params}`);
  
  if (!response.ok) {
    throw new Error('Failed to check slug uniqueness');
  }
  
  const data = await response.json();
  return data.isUnique;
}