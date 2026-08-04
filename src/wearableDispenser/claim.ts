import { signedFetch } from '~system/SignedFetch'
import { timers } from '@dcl/sdk/ecs'
import { getPlayer } from '@dcl/sdk/players'
import { WEARABLE_CONFIG } from './config'
import { showClaimPending, showClaimDone, hideClaim } from './claimUi'

// Free-wearable claim. Guards against double-claims per session.
let claiming = false
let claimed  = false

// Keep "New item on the way" on screen at least this long before flipping to
// "Received!", even if the API responds instantly.
const MIN_PENDING_MS = 3000

export function claimWearable() {
  if (claiming) return
  if (claimed) { showClaimDone(); return }   // already got it → just re-show "Received!"

  const localAddress = getPlayer()?.userId
  if (!localAddress) {
    console.log('[Wearable] no wallet address yet — cannot claim')
    return
  }

  claiming = true
  showClaimPending()
  const pendingStart = Date.now()

  void (async () => {
    let success = false
    try {
      const url = `${WEARABLE_CONFIG.rewardsApi}/${WEARABLE_CONFIG.campaignId}/rewards`
      const response = await signedFetch({
        url,
        init: {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            campaign_key: WEARABLE_CONFIG.campaignKey,
            beneficiary:  localAddress,
            catalyst:     WEARABLE_CONFIG.catalyst
          })
        }
      })

      console.log(`[Wearable] <- HTTP ${response.status}: ${response.body?.substring(0, 200)}`)

      let data: { ok?: boolean; data?: { token?: string }[]; error?: string } = {}
      try { data = JSON.parse(response.body ?? '{}') } catch { /* plain-text response */ }

      if (data.ok && data.data?.[0]) {
        claimed = true
        success = true
        console.log(`[Wearable] ✓ received! token: ${data.data[0].token ?? 'claimed'}`)
      } else {
        console.error(`[Wearable] ✗ claim failed: ${data.error ?? response.body}`)
      }
    } catch (err) {
      console.error('[Wearable] ✗ claim error:', err)
    } finally {
      claiming = false
      // Keep the overlay up for at least MIN_PENDING_MS in every case, then show
      // the outcome — so the message never flashes, even on an instant failure.
      const wait = Math.max(0, MIN_PENDING_MS - (Date.now() - pendingStart))
      timers.setTimeout(() => { success ? showClaimDone() : hideClaim() }, wait)
    }
  })()
}
