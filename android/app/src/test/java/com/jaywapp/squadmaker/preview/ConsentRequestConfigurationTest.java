package com.jaywapp.squadmaker.preview;

import static org.junit.Assert.assertEquals;

import com.google.android.gms.ads.RequestConfiguration;
import java.util.Arrays;
import org.junit.Test;

public class ConsentRequestConfigurationTest {
    @Test
    public void forwardsBothTfuaValuesAndPreservesOtherRequestSettings() {
        RequestConfiguration existing = new RequestConfiguration.Builder()
            .setTestDeviceIds(Arrays.asList("test-device-one", "test-device-two"))
            .setMaxAdContentRating(RequestConfiguration.MAX_AD_CONTENT_RATING_PG)
            .setPublisherPrivacyPersonalizationState(RequestConfiguration.PublisherPrivacyPersonalizationState.DISABLED)
            .setTagForChildDirectedTreatment(RequestConfiguration.TAG_FOR_CHILD_DIRECTED_TREATMENT_UNSPECIFIED)
            .build();
        for (boolean underAge : new boolean[] { true, false }) {
            RequestConfiguration result = ConsentRequestConfiguration.apply(existing, underAge);
            assertEquals(underAge ? RequestConfiguration.TAG_FOR_UNDER_AGE_OF_CONSENT_TRUE
                : RequestConfiguration.TAG_FOR_UNDER_AGE_OF_CONSENT_FALSE, result.getTagForUnderAgeOfConsent());
            assertEquals(existing.getTestDeviceIds(), result.getTestDeviceIds());
            assertEquals(existing.getMaxAdContentRating(), result.getMaxAdContentRating());
            assertEquals(existing.getTagForChildDirectedTreatment(), result.getTagForChildDirectedTreatment());
            assertEquals(existing.getPublisherPrivacyPersonalizationState(), result.getPublisherPrivacyPersonalizationState());
        }
        assertEquals(RequestConfiguration.TAG_FOR_UNDER_AGE_OF_CONSENT_UNSPECIFIED, existing.getTagForUnderAgeOfConsent());
    }
}
