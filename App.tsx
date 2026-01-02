
import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header.tsx';
import { SearchForm } from './components/SearchForm.tsx';
import { SecondaryActions } from './components/SecondaryActions.tsx';
import { ResultsDisplay } from './components/ResultsDisplay.tsx';
import { Footer } from './components/Footer.tsx';
import { useGeminiSearch } from './hooks/useGeminiSearch.ts';
import { useLocalStorage } from './hooks/useLocalStorage.ts';
import type { Project, GroundingChunk } from './types.ts';

export default function App() {
  const [region, setRegion] = useState('USA');
  const [dateRange, setDateRange] = useState('Past 3 months');
  const [allProjects, setAllProjects] = useLocalStorage<Project[]>('allProjects', []);
  const [currentSearchResults, setCurrentSearchResults] = useState<Project[]>([]);
  const [currentGroundingChunks, setCurrentGroundingChunks] = useState<GroundingChunk[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const { searchProjects, isLoading, error } = useGeminiSearch();

  const handleSearch = useCallback(async () => {
    setIsSearching(true);
    setCurrentSearchResults([]);
    setCurrentGroundingChunks([]);
    const { projects, groundingChunks } = await searchProjects(region, dateRange);
    
    if (projects.length > 0) {
      setCurrentSearchResults(projects);
      setAllProjects(prevProjects => {
        const existingUrls = new Set(prevProjects.map(p => p.sourceUrl));
        const newUniqueProjects = projects.filter(p => p.sourceUrl && !existingUrls.has(p.sourceUrl));
        return [...prevProjects, ...newUniqueProjects];
      });
    }
    if(groundingChunks) {
      setCurrentGroundingChunks(groundingChunks);
    }
  }, [region, dateRange, searchProjects, setAllProjects]);

  const handleDownload = () => {
    const dataToDownload = isSearching ? currentSearchResults : allProjects;
    if (dataToDownload.length === 0) {
      alert("No data to download.");
      return;
    }
    const csvHeader = "Project Name,Company,Location,Summary,Contacts,Source URL\n";
    const csvRows = dataToDownload.map(p => {
      const contactsString = (p.contacts || [])
        .map(c => `${c.name} (${c.title})`)
        .join('; ');
      
      return [
        `"${p.projectName.replace(/"/g, '""')}"`, 
        `"${p.company.replace(/"/g, '""')}"`, 
        `"${p.location.replace(/"/g, '""')}"`, 
        `"${p.summary.replace(/"/g, '""')}"`, 
        `"${contactsString.replace(/"/g, '""')}"`,
        p.sourceUrl
      ].join(',');
    }).join('\n');
    const csvContent = csvHeader + csvRows;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-s-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'fiber_projects.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const displayProjects = isSearching ? currentSearchResults : allProjects;

  return (
    <div className="min-h-screen bg-[#111217] text-gray-200 font-sans antialiased flex flex-col">
      <main className="flex-grow container mx-auto px-4 py-8 md:py-12">
        <Header />
        <div className="mt-8 max-w-4xl mx-auto">
          <SearchForm
            region={region}
            setRegion={setRegion}
            dateRange={dateRange}
            setDateRange={setDateRange}
            onSearch={handleSearch}
            isLoading={isLoading}
          />
          <SecondaryActions onDownload={handleDownload} />
          <ResultsDisplay
            projects={displayProjects}
            groundingChunks={currentGroundingChunks}
            isLoading={isLoading}
            error={error}
            isSearching={isSearching}
            setIsSearching={setIsSearching}
            allProjectsCount={allProjects.length}
          />
        </div>
      </main>
      <Footer />
    </div>
  );
}
