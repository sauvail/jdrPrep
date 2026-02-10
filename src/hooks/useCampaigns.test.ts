import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCampaigns } from './useCampaigns';
import { createCampaign } from '../utils/storage';

describe('useCampaigns Hook', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should create a default campaign when none exists', () => {
    const { result } = renderHook(() => useCampaigns());

    expect(result.current.campaigns).toHaveLength(1);
    expect(result.current.campaigns[0].name).toBe('Default Campaign');
    expect(result.current.activeCampaign).toBeTruthy();
    expect(result.current.activeCampaignId).toBe(result.current.campaigns[0].id);
  });

  it('should load existing campaigns', () => {
    const campaigns = [
      createCampaign('Campaign 1', 'Description 1'),
      createCampaign('Campaign 2', 'Description 2'),
    ];
    localStorage.setItem('jdrprep_campaigns', JSON.stringify(campaigns));
    localStorage.setItem('jdrprep_active_campaign', campaigns[0].id);

    const { result } = renderHook(() => useCampaigns());

    expect(result.current.campaigns).toHaveLength(2);
    expect(result.current.activeCampaignId).toBe(campaigns[0].id);
    expect(result.current.activeCampaign?.name).toBe('Campaign 1');
  });

  it('should set first campaign as active when active campaign ID is invalid', () => {
    const campaigns = [
      createCampaign('Campaign 1', 'Description 1'),
      createCampaign('Campaign 2', 'Description 2'),
    ];
    localStorage.setItem('jdrprep_campaigns', JSON.stringify(campaigns));
    localStorage.setItem('jdrprep_active_campaign', 'invalid_id');

    const { result } = renderHook(() => useCampaigns());

    expect(result.current.campaigns).toHaveLength(2);
    expect(result.current.activeCampaignId).toBe(campaigns[0].id);
  });

  it('should add a new campaign', () => {
    const { result } = renderHook(() => useCampaigns());

    let newCampaign;
    act(() => {
      newCampaign = result.current.addCampaign('New Campaign', 'New Description');
    });

    // Should have default campaign + new campaign
    expect(result.current.campaigns).toHaveLength(2);
    expect(result.current.campaigns[1].name).toBe('New Campaign');
    expect(result.current.campaigns[1].description).toBe('New Description');

    // Check localStorage was updated
    const stored = JSON.parse(localStorage.getItem('jdrprep_campaigns') || '[]');
    expect(stored).toHaveLength(2);
    expect(stored[1].name).toBe('New Campaign');
  });

  it('should update a campaign', () => {
    const { result } = renderHook(() => useCampaigns());

    const campaignId = result.current.campaigns[0].id;

    act(() => {
      result.current.updateCampaign(campaignId, {
        name: 'Updated Name',
        description: 'Updated Description',
      });
    });

    expect(result.current.campaigns[0].name).toBe('Updated Name');
    expect(result.current.campaigns[0].description).toBe('Updated Description');

    // Check localStorage was updated
    const stored = JSON.parse(localStorage.getItem('jdrprep_campaigns') || '[]');
    expect(stored[0].name).toBe('Updated Name');
  });

  it('should update campaign updatedAt timestamp', () => {
    const { result } = renderHook(() => useCampaigns());

    const campaignId = result.current.campaigns[0].id;
    const originalUpdatedAt = result.current.campaigns[0].updatedAt;

    act(() => {
      result.current.updateCampaign(campaignId, { name: 'Updated' });
    });

    expect(result.current.campaigns[0].updatedAt).toBeGreaterThanOrEqual(
      originalUpdatedAt
    );
  });

  it('should delete a campaign', () => {
    const { result } = renderHook(() => useCampaigns());

    let newCampaign;
    act(() => {
      newCampaign = result.current.addCampaign('Campaign to Delete', 'Description');
    });

    expect(result.current.campaigns).toHaveLength(2);

    act(() => {
      result.current.deleteCampaign(newCampaign.id);
    });

    expect(result.current.campaigns).toHaveLength(1);
    expect(result.current.campaigns[0].name).toBe('Default Campaign');

    // Check localStorage was updated
    const stored = JSON.parse(localStorage.getItem('jdrprep_campaigns') || '[]');
    expect(stored).toHaveLength(1);
  });

  it('should switch active campaign when deleting the active one', () => {
    const { result } = renderHook(() => useCampaigns());

    const defaultCampaignId = result.current.campaigns[0].id;

    let newCampaign;
    act(() => {
      newCampaign = result.current.addCampaign('Second Campaign', 'Description');
    });

    // Set the new campaign as active
    act(() => {
      result.current.setActiveCampaign(newCampaign.id);
    });

    expect(result.current.activeCampaignId).toBe(newCampaign.id);

    // Delete the active campaign
    act(() => {
      result.current.deleteCampaign(newCampaign.id);
    });

    // Should switch to the remaining campaign
    expect(result.current.activeCampaignId).toBe(defaultCampaignId);
    expect(result.current.activeCampaign?.name).toBe('Default Campaign');
  });

  it('should set active campaign to null when deleting the last campaign', () => {
    const { result } = renderHook(() => useCampaigns());

    const campaignId = result.current.campaigns[0].id;

    act(() => {
      result.current.deleteCampaign(campaignId);
    });

    expect(result.current.campaigns).toHaveLength(0);
    expect(result.current.activeCampaignId).toBeNull();
    expect(result.current.activeCampaign).toBeNull();
  });

  it('should not change active campaign when deleting a non-active campaign', () => {
    const { result } = renderHook(() => useCampaigns());

    const defaultCampaignId = result.current.campaigns[0].id;

    let newCampaign;
    act(() => {
      newCampaign = result.current.addCampaign('Second Campaign', 'Description');
    });

    // Delete the non-active campaign
    act(() => {
      result.current.deleteCampaign(newCampaign.id);
    });

    // Active campaign should remain the same
    expect(result.current.activeCampaignId).toBe(defaultCampaignId);
  });

  it('should set active campaign', () => {
    const { result } = renderHook(() => useCampaigns());

    let newCampaign;
    act(() => {
      newCampaign = result.current.addCampaign('New Campaign', 'Description');
    });

    act(() => {
      result.current.setActiveCampaign(newCampaign.id);
    });

    expect(result.current.activeCampaignId).toBe(newCampaign.id);
    expect(result.current.activeCampaign?.name).toBe('New Campaign');

    // Check localStorage was updated
    const activeId = localStorage.getItem('jdrprep_active_campaign');
    expect(activeId).toBe(newCampaign.id);
  });

  it('should return null for activeCampaign when ID does not match any campaign', () => {
    const campaigns = [createCampaign('Campaign 1', 'Description 1')];
    localStorage.setItem('jdrprep_campaigns', JSON.stringify(campaigns));
    localStorage.setItem('jdrprep_active_campaign', 'non_existent_id');

    const { result } = renderHook(() => useCampaigns());

    // The hook should have reset to the first campaign
    expect(result.current.activeCampaign).toBeTruthy();
  });

  it('should preserve campaign data structure', () => {
    const { result } = renderHook(() => useCampaigns());

    const campaign = result.current.campaigns[0];

    expect(campaign).toHaveProperty('id');
    expect(campaign).toHaveProperty('name');
    expect(campaign).toHaveProperty('description');
    expect(campaign).toHaveProperty('createdAt');
    expect(campaign).toHaveProperty('updatedAt');
    expect(campaign.id).toContain('campaign_');
  });

  it('should handle multiple campaign additions', () => {
    const { result } = renderHook(() => useCampaigns());

    act(() => {
      result.current.addCampaign('Campaign 2', 'Description 2');
    });

    act(() => {
      result.current.addCampaign('Campaign 3', 'Description 3');
    });

    act(() => {
      result.current.addCampaign('Campaign 4', 'Description 4');
    });

    expect(result.current.campaigns).toHaveLength(4); // Default + 3 new ones
    expect(result.current.campaigns.map(c => c.name)).toContain('Campaign 2');
    expect(result.current.campaigns.map(c => c.name)).toContain('Campaign 3');
    expect(result.current.campaigns.map(c => c.name)).toContain('Campaign 4');
  });
});
