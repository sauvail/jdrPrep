import { useState, useEffect } from 'react';
import { Campaign } from '../types';
import { 
  loadCampaigns, 
  saveCampaigns, 
  getActiveCampaignId, 
  setActiveCampaignId,
  createCampaign as createCampaignUtil
} from '../utils/storage';

export const useCampaigns = () => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [activeCampaignId, setActiveCampaignIdState] = useState<string | null>(null);

  useEffect(() => {
    const loadedCampaigns = loadCampaigns();
    setCampaigns(loadedCampaigns);
    
    // Get or create default campaign
    let activeId = getActiveCampaignId();
    
    if (!activeId || !loadedCampaigns.find(c => c.id === activeId)) {
      if (loadedCampaigns.length > 0) {
        activeId = loadedCampaigns[0].id;
      } else {
        // Create default campaign
        const defaultCampaign = createCampaignUtil('Default Campaign', 'My first campaign');
        const updatedCampaigns = [defaultCampaign];
        setCampaigns(updatedCampaigns);
        saveCampaigns(updatedCampaigns);
        activeId = defaultCampaign.id;
      }
      setActiveCampaignId(activeId);
    }
    
    setActiveCampaignIdState(activeId);
  }, []);

  const addCampaign = (name: string, description: string) => {
    const newCampaign = createCampaignUtil(name, description);
    const updated = [...campaigns, newCampaign];
    setCampaigns(updated);
    saveCampaigns(updated);
    return newCampaign;
  };

  const updateCampaign = (id: string, updates: Partial<Campaign>) => {
    const updated = campaigns.map(c => 
      c.id === id ? { ...c, ...updates, updatedAt: Date.now() } : c
    );
    setCampaigns(updated);
    saveCampaigns(updated);
  };

  const deleteCampaign = (id: string) => {
    const updated = campaigns.filter(c => c.id !== id);
    setCampaigns(updated);
    saveCampaigns(updated);
    
    // If we deleted the active campaign, switch to the first available
    if (activeCampaignId === id) {
      const newActiveId = updated.length > 0 ? updated[0].id : null;
      setActiveCampaignIdState(newActiveId);
      if (newActiveId) {
        setActiveCampaignId(newActiveId);
      }
    }
  };

  const setActiveCampaign = (id: string) => {
    setActiveCampaignIdState(id);
    setActiveCampaignId(id);
  };

  const activeCampaign = campaigns.find(c => c.id === activeCampaignId) || null;

  return {
    campaigns,
    activeCampaign,
    activeCampaignId,
    addCampaign,
    updateCampaign,
    deleteCampaign,
    setActiveCampaign,
  };
};
