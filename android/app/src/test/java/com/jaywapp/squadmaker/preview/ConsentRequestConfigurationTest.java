package com.jaywapp.squadmaker.preview;

import static org.junit.Assert.assertEquals;

import com.google.android.gms.ads.AgeRestrictedTreatment;
import com.google.android.gms.ads.RequestConfiguration;
import java.util.Arrays;
import org.junit.Test;

public class ConsentRequestConfigurationTest {
    @Test
    public void appliesTeenBaselineAndPreservesUnrelatedSettingsAndOriginal() {
        RequestConfiguration existing = new RequestConfiguration.Builder()
            .setTestDeviceIds(Arrays.asList("test-device-one", "test-device-two"))
            .setMaxAdContentRating(RequestConfiguration.MAX_AD_CONTENT_RATING_PG)
            .setPublisherPrivacyPersonalizationState(RequestConfiguration.PublisherPrivacyPersonalizationState.ENABLED)
            .setTagForChildDirectedTreatment(RequestConfiguration.TAG_FOR_CHILD_DIRECTED_TREATMENT_UNSPECIFIED)
            .build();
        RequestConfiguration result = ConsentRequestConfiguration.apply(existing, false);
        assertEquals(AgeRestrictedTreatment.TEEN, result.getAgeRestrictedTreatment());
        assertEquals(RequestConfiguration.MAX_AD_CONTENT_RATING_G, result.getMaxAdContentRating());
        assertEquals(RequestConfiguration.PublisherPrivacyPersonalizationState.DISABLED, result.getPublisherPrivacyPersonalizationState());
        assertEquals(existing.getTestDeviceIds(), result.getTestDeviceIds());
        assertEquals(existing.getTagForChildDirectedTreatment(), result.getTagForChildDirectedTreatment());
        assertEquals(RequestConfiguration.TAG_FOR_UNDER_AGE_OF_CONSENT_UNSPECIFIED, result.getTagForUnderAgeOfConsent());
        assertEquals(RequestConfiguration.TAG_FOR_UNDER_AGE_OF_CONSENT_UNSPECIFIED, existing.getTagForUnderAgeOfConsent());
        assertEquals(RequestConfiguration.MAX_AD_CONTENT_RATING_PG, existing.getMaxAdContentRating());
        assertEquals(RequestConfiguration.PublisherPrivacyPersonalizationState.ENABLED, existing.getPublisherPrivacyPersonalizationState());
    }

    @Test
    public void existingChildAndLegacyChildSignalsAlwaysOverrideTeenBaseline() {
        RequestConfiguration[] childCases = {
            new RequestConfiguration.Builder().setAgeRestrictedTreatment(AgeRestrictedTreatment.CHILD)
                .setTagForUnderAgeOfConsent(RequestConfiguration.TAG_FOR_UNDER_AGE_OF_CONSENT_FALSE).build(),
            new RequestConfiguration.Builder().setAgeRestrictedTreatment(AgeRestrictedTreatment.TEEN)
                .setTagForUnderAgeOfConsent(RequestConfiguration.TAG_FOR_UNDER_AGE_OF_CONSENT_TRUE).build(),
            new RequestConfiguration.Builder().setAgeRestrictedTreatment(AgeRestrictedTreatment.UNSPECIFIED)
                .setTagForChildDirectedTreatment(RequestConfiguration.TAG_FOR_CHILD_DIRECTED_TREATMENT_TRUE).build()
        };
        for (RequestConfiguration existing : childCases) {
            for (boolean underAge : new boolean[] { false, true }) {
                RequestConfiguration result = ConsentRequestConfiguration.apply(existing, underAge);
                assertEquals(AgeRestrictedTreatment.CHILD, result.getAgeRestrictedTreatment());
                assertEquals(existing.getTagForChildDirectedTreatment(), result.getTagForChildDirectedTreatment());
                assertEquals(RequestConfiguration.PublisherPrivacyPersonalizationState.DISABLED, result.getPublisherPrivacyPersonalizationState());
                assertEquals(RequestConfiguration.MAX_AD_CONTENT_RATING_G, result.getMaxAdContentRating());
            }
        }
    }

    @Test
    public void falseInputNeverReclassifiesExistingTfuaButTrueStrengthensIt() {
        int[] signals = { RequestConfiguration.TAG_FOR_UNDER_AGE_OF_CONSENT_UNSPECIFIED,
            RequestConfiguration.TAG_FOR_UNDER_AGE_OF_CONSENT_FALSE,
            RequestConfiguration.TAG_FOR_UNDER_AGE_OF_CONSENT_TRUE };
        for (int signal : signals) {
            RequestConfiguration existing = new RequestConfiguration.Builder().setTagForUnderAgeOfConsent(signal).build();
            assertEquals(signal, ConsentRequestConfiguration.apply(existing, false).getTagForUnderAgeOfConsent());
            RequestConfiguration underAge = ConsentRequestConfiguration.apply(existing, true);
            assertEquals(RequestConfiguration.TAG_FOR_UNDER_AGE_OF_CONSENT_TRUE, underAge.getTagForUnderAgeOfConsent());
            assertEquals(AgeRestrictedTreatment.CHILD, underAge.getAgeRestrictedTreatment());
        }
    }

    @Test
    public void everyPreviousPersonalizationAndContentSettingReceivesApprovedLimits() {
        String[] ratings = { "", RequestConfiguration.MAX_AD_CONTENT_RATING_G,
            RequestConfiguration.MAX_AD_CONTENT_RATING_PG, RequestConfiguration.MAX_AD_CONTENT_RATING_T,
            RequestConfiguration.MAX_AD_CONTENT_RATING_MA };
        for (String rating : ratings) {
            for (RequestConfiguration.PublisherPrivacyPersonalizationState state : RequestConfiguration.PublisherPrivacyPersonalizationState.values()) {
                RequestConfiguration existing = new RequestConfiguration.Builder()
                    .setMaxAdContentRating(rating).setPublisherPrivacyPersonalizationState(state).build();
                RequestConfiguration result = ConsentRequestConfiguration.apply(existing, false);
                assertEquals(RequestConfiguration.MAX_AD_CONTENT_RATING_G, result.getMaxAdContentRating());
                assertEquals(RequestConfiguration.PublisherPrivacyPersonalizationState.DISABLED, result.getPublisherPrivacyPersonalizationState());
            }
        }
    }

    @Test
    public void repeatedApplicationCannotDowngradeChildOrLoseTestDevices() {
        RequestConfiguration initial = new RequestConfiguration.Builder()
            .setAgeRestrictedTreatment(AgeRestrictedTreatment.TEEN)
            .setTestDeviceIds(Arrays.asList("test-device-one")).build();
        RequestConfiguration child = ConsentRequestConfiguration.apply(initial, true);
        RequestConfiguration repeated = ConsentRequestConfiguration.apply(child, false);
        assertEquals(AgeRestrictedTreatment.CHILD, repeated.getAgeRestrictedTreatment());
        assertEquals(RequestConfiguration.TAG_FOR_UNDER_AGE_OF_CONSENT_TRUE, repeated.getTagForUnderAgeOfConsent());
        assertEquals(child.getTestDeviceIds(), repeated.getTestDeviceIds());
        assertEquals(child.getMaxAdContentRating(), repeated.getMaxAdContentRating());
        assertEquals(child.getPublisherPrivacyPersonalizationState(), repeated.getPublisherPrivacyPersonalizationState());
        assertEquals(AgeRestrictedTreatment.TEEN, initial.getAgeRestrictedTreatment());
    }
}
