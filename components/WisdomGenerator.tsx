'use client';

import { useState } from 'react';
import { Sparkles, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';

const styles = [
  { value: 'humorous', label: '😄 Humorous', description: 'Witty and fun' },
  { value: 'insightful', label: '💡 Insightful', description: 'Deep and thoughtful' },
  { value: 'sarcastic', label: '😏 Sarcastic', description: 'Playfully cynical' },
  { value: 'philosophical', label: '🤔 Philosophical', description: 'Profound reflections' },
];

export default function WisdomGenerator() {
  const [topic, setTopic] = useState('');
  const [style, setStyle] = useState('humorous');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedWisdom, setGeneratedWisdom] = useState('');

  const handleGenerate = async () => {
    if (isGenerating) return;

    setIsGenerating(true);
    setGeneratedWisdom('');

    try {
      const response = await fetch('/api/wisdom/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: topic || undefined, style }),
      });

      if (response.ok) {
        const data = await response.json();
        setGeneratedWisdom(data.wisdom);
        toast.success('Wisdom generated!');
      } else {
        throw new Error('Failed to generate wisdom');
      }
    } catch (error) {
      console.error('Error generating wisdom:', error);
      toast.error('Failed to generate wisdom. Make sure you have messages in the database and an OpenAI API key set.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8">
      <h2 className="text-2xl font-semibold mb-6 text-gray-900 dark:text-white">
        Generate Wisdom
      </h2>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Topic (optional)
          </label>
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g., BGP, DNS, network outages, IPv6..."
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
          />
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Leave empty for random wisdom from all messages
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Style
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {styles.map((s) => (
              <button
                key={s.value}
                onClick={() => setStyle(s.value)}
                className={cn(
                  "p-4 rounded-lg border-2 transition-all text-left min-h-[80px] flex flex-col justify-center",
                  style === s.value
                    ? "border-purple-500 bg-purple-50 dark:bg-purple-900/20"
                    : "border-gray-200 dark:border-gray-600 hover:border-purple-300"
                )}
              >
                <div className="font-medium text-gray-900 dark:text-white text-base mb-1">
                  {s.label}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {s.description}
                </div>
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={handleGenerate}
          disabled={isGenerating}
          className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-medium py-3 px-6 rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Generating wisdom...
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              Generate Wisdom
            </>
          )}
        </button>

        {generatedWisdom && (
          <div className="mt-6 p-6 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-lg">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Generated Wisdom:
            </h3>
            <blockquote className="text-lg font-medium text-gray-900 dark:text-white italic">
              &quot;{generatedWisdom}&quot;
            </blockquote>
          </div>
        )}
      </div>
    </div>
  );
}