/**
 * Wearable-claim campaign config.
 * Replace campaignId / campaignKey with YOUR DCL Rewards campaign.
 * The campaign_key is not sensitive for non-captcha campaigns.
 */
export const WEARABLE_CONFIG = {
  campaignId:  '34923698-3107-4b0c-8968-2f0d90bcea63',
  // Dispenser key (base64 secret) — the campaign_key sent with each claim.
  campaignKey: 'tH95hT6uQCWCITnSBLljxDSSNpgxB0sMiWgvDZC86mM=.VLoVqyGRwMLooMysTEz5b1EAe173cCG5i0naKcpzdFA=',
  rewardsApi:  'https://rewards.decentraland.org/api/campaigns',
  catalyst:    'https://realm-provider-ea.decentraland.org'
}
