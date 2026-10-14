package com.jaywapp.squadmaker.preview;

import com.google.android.gms.ads.RequestConfiguration;

/** Copies existing SDK settings while forwarding UMP's build-time TFUA value. */
final class ConsentRequestConfiguration {
    static RequestConfiguration apply(RequestConfiguration existing, boolean underAgeOfConsent) {
        return existing.toBuilder().setTagForUnderAgeOfConsent(underAgeOfConsent
            ? RequestConfiguration.TAG_FOR_UNDER_AGE_OF_CONSENT_TRUE
            : RequestConfiguration.TAG_FOR_UNDER_AGE_OF_CONSENT_FALSE).build();
    }
}
