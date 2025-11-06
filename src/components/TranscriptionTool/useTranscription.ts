import { useState } from 'react';
import { useAuth } from '../../lib/auth';
import { supabase } from '../../lib/supabase';
import { convertYouTubeToM4A, isValidYouTubeUrl, ConversionProgress } from '../../lib/youtubeConverter';
import { InputMode } from './types';

export const useTranscription = (
  mode: InputMode,
  file: File | null,
  youtubeUrl: string,
  audioChunksRef: React.MutableRefObject<Blob[]>,
  energyPoints: number,
  setEnergyPoints: (points: number) => void,
  onTranscriptionStart?: () => void
) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [converting, setConverting] = useState(false);
  const [conversionProgress, setConversionProgress] = useState<ConversionProgress | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!user) {
      setError('Please sign in to use transcription');
      return;
    }

    if (energyPoints < 10) {
      setError('Not enough energy points. Please upgrade your plan.');
      return;
    }

    if (mode === 'file' && !file) {
      setError('Please select a file');
      return;
    }

    if (mode === 'youtube' && !youtubeUrl) {
      setError('Please enter a YouTube URL');
      return;
    }

    if (mode === 'youtube' && !isValidYouTubeUrl(youtubeUrl)) {
      setError('Please enter a valid YouTube URL');
      return;
    }

    if (mode === 'recording' && audioChunksRef.current.length === 0) {
      setError('Please record audio first');
      return;
    }

    setLoading(true);
    setError('');
    onTranscriptionStart?.();

    try {
      // Check if Supabase is configured
      if (!supabase) {
        setError('Transcription service is not configured. Please configure Supabase or integrate with transcription API.');
        setLoading(false);
        return;
      }

      let inputSource = '';
      let inputType: InputMode = mode;
      let fileToUpload: File | null = null;

      // Handle YouTube conversion
      if (mode === 'youtube' && youtubeUrl) {
        try {
          setConverting(true);
          setConversionProgress({ progress: 0, stage: 'loading' });
          
          // Convert YouTube video to M4A
          fileToUpload = await convertYouTubeToM4A(youtubeUrl, (progress) => {
            setConversionProgress(progress);
          });
          
          setConverting(false);
          setConversionProgress(null);
          
          // Use the converted file for transcription
          inputSource = youtubeUrl;
          inputType = 'file'; // Treat as file after conversion
        } catch (conversionError: any) {
          setConverting(false);
          setConversionProgress(null);
          setError(conversionError.message || 'Failed to convert YouTube video. Please check your backend proxy configuration.');
          setLoading(false);
          return;
        }
      } else if (mode === 'file' && file) {
        fileToUpload = file;
        inputSource = file.name;
      } else if (mode === 'recording') {
        // For recording, create file from audio chunks
        if (audioChunksRef.current.length > 0) {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          fileToUpload = new File([audioBlob], 'recording.webm', { type: 'audio/webm' });
        }
        inputSource = 'live_recording';
      }

      const energyCost = 10;

      // Note: This Supabase integration expects UUID user_id
      // JWT auth uses email as user_id, so this may need backend API integration instead
      if (!supabase) {
        setError('Transcription service requires Supabase configuration or transcription API integration.');
        setLoading(false);
        return;
      }

      // For JWT users, we need to find or create a profile by email
      // This is a workaround - ideally use transcription API instead
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', user.user_id)
        .maybeSingle();

      let profileId = profile?.id;
      
      // If no profile exists, create one (this is a workaround)
      if (!profileId) {
        // Generate a UUID for the profile (this is not ideal but works for now)
        const uuid = crypto.randomUUID();
        const { data: newProfile, error: createError } = await supabase
          .from('profiles')
          .insert({
            id: uuid,
            email: user.user_id,
            full_name: user.name,
            energy_points: 100,
          })
          .select('id')
          .single();
        
        if (createError) {
          throw new Error(`Failed to create profile: ${createError.message}`);
        }
        profileId = newProfile.id;
      }

      const { error: insertError } = await supabase
        .from('transcriptions')
        .insert({
          user_id: profileId,
          input_type: inputType,
          input_source: inputSource,
          energy_cost: energyCost,
          status: 'processing',
        });

      if (insertError) throw insertError;

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ energy_points: energyPoints - energyCost })
        .eq('id', profileId);

      if (updateError) throw updateError;

      setEnergyPoints(energyPoints - energyCost);

      // Reset form
      audioChunksRef.current = [];

      setTimeout(async () => {
        if (!supabase) return;
        
        // Get profile ID first
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('email', user.user_id)
          .maybeSingle();

        if (!profile) return;

        const { data: transcriptions } = await supabase
          .from('transcriptions')
          .select('id')
          .eq('user_id', profile.id)
          .eq('status', 'processing')
          .order('created_at', { ascending: false })
          .limit(1);

        if (transcriptions && transcriptions.length > 0) {
          await supabase
            .from('transcriptions')
            .update({
              status: 'completed',
              transcription_text: 'This is a sample transcription. In production, this would be processed by a transcription service.',
              duration_seconds: Math.floor(Math.random() * 180) + 30,
            })
            .eq('id', transcriptions[0].id);
        }
      }, 3000);

    } catch (err: any) {
      setError(err.message || 'Failed to start transcription');
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    converting,
    conversionProgress,
    handleSubmit,
    setError,
  };
};

