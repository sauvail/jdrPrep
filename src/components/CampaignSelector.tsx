import { useState } from 'react';
import { Campaign } from '../types';
import './CampaignSelector.css';

interface CampaignSelectorProps {
  campaigns: Campaign[];
  activeCampaign: Campaign | null;
  onSelectCampaign: (id: string) => void;
  onAddCampaign: (name: string, description: string) => void;
  onDeleteCampaign: (id: string) => void;
}

function CampaignSelector({
  campaigns,
  activeCampaign,
  onSelectCampaign,
  onAddCampaign,
  onDeleteCampaign,
}: CampaignSelectorProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');

  const handleAddCampaign = (e: React.FormEvent) => {
    e.preventDefault();
    if (newName.trim()) {
      onAddCampaign(newName.trim(), newDescription.trim());
      setNewName('');
      setNewDescription('');
      setShowForm(false);
      setShowDropdown(false);
    }
  };

  const handleSelectCampaign = (id: string) => {
    onSelectCampaign(id);
    setShowDropdown(false);
  };

  const handleDeleteCampaign = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (campaigns.length > 1 && confirm('Are you sure you want to delete this campaign? All entities and maps will be lost.')) {
      onDeleteCampaign(id);
    } else if (campaigns.length === 1) {
      alert('Cannot delete the last campaign. Create a new one first.');
    }
  };

  return (
    <div className="campaign-selector">
      <button
        className="campaign-selector-btn"
        onClick={() => setShowDropdown(!showDropdown)}
      >
        📁 {activeCampaign?.name || 'Select Campaign'} ▼
      </button>
      
      {showDropdown && (
        <div className="campaign-dropdown">
          <div className="campaign-list">
            {campaigns.map(campaign => (
              <div
                key={campaign.id}
                className={`campaign-item ${campaign.id === activeCampaign?.id ? 'active' : ''}`}
                onClick={() => handleSelectCampaign(campaign.id)}
              >
                <div className="campaign-info">
                  <div className="campaign-name">{campaign.name}</div>
                  {campaign.description && (
                    <div className="campaign-description">{campaign.description}</div>
                  )}
                </div>
                {campaigns.length > 1 && (
                  <button
                    className="delete-campaign-btn"
                    onClick={(e) => handleDeleteCampaign(e, campaign.id)}
                    title="Delete campaign"
                  >
                    🗑️
                  </button>
                )}
              </div>
            ))}
          </div>
          
          {!showForm && (
            <button
              className="add-campaign-btn"
              onClick={() => setShowForm(true)}
            >
              + New Campaign
            </button>
          )}
          
          {showForm && (
            <form className="campaign-form" onSubmit={handleAddCampaign}>
              <input
                type="text"
                placeholder="Campaign name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                autoFocus
              />
              <textarea
                placeholder="Description (optional)"
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                rows={2}
              />
              <div className="form-actions">
                <button type="submit">Create</button>
                <button type="button" onClick={() => setShowForm(false)}>
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
}

export default CampaignSelector;
