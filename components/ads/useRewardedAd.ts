import { useEffect, useState } from 'react';
import { RewardedAd, RewardedAdEventType, TestIds } from 'react-native-google-mobile-ads';
import { Platform } from 'react-native';

const adUnitId = __DEV__ ? TestIds.REWARDED : Platform.OS === 'ios' ? 'ca-app-pub-3940256099942544/1712480198' : 'ca-app-pub-3940256099942544/5224354917';

let rewarded = RewardedAd.createForAdRequest(adUnitId, {
  requestNonPersonalizedAdsOnly: true,
});
let isAdLoaded = false;
let isLoading = false;

const loadAd = () => {
  if (isAdLoaded || isLoading) return;
  isLoading = true;
  rewarded.load();
};

rewarded.addAdEventListener(RewardedAdEventType.LOADED, () => {
  isAdLoaded = true;
  isLoading = false;
});
// Kick off initial load
loadAd();

export const useRewardedAd = () => {
  const [loaded, setLoaded] = useState(isAdLoaded);

  useEffect(() => {
    setLoaded(isAdLoaded);

    const unsubscribeLoaded = rewarded.addAdEventListener(RewardedAdEventType.LOADED, () => {
      setLoaded(true);
    });

    if (!isAdLoaded && !isLoading) {
      loadAd();
    }

    return () => {
      unsubscribeLoaded();
    };
  }, []);

  const showAd = (onEarned: () => void, onDismissed: () => void) => {
    if (isAdLoaded) {
      let rewardEarned = false;
      const unsubEarned = rewarded.addAdEventListener(RewardedAdEventType.EARNED_REWARD, () => {
        rewardEarned = true;
        onEarned();
      });
      const unsubClosed = rewarded.addAdEventListener(RewardedAdEventType.CLOSED, () => {
        unsubEarned();
        unsubClosed();
        isAdLoaded = false;
        setLoaded(false);
        loadAd(); // Preload next ad
        if (!rewardEarned) {
           // They closed it before earning reward, but we still call onDismissed
           // The caller handles whether the reward was given or not.
        }
        onDismissed();
      });
      rewarded.show();
    } else {
      // Fallback: If ad isn't loaded, let them do it anyway
      console.log('Ad not ready, skipping ad...');
      onEarned();
      onDismissed();
      loadAd();
    }
  };

  return { isLoaded: loaded, showAd };
};
