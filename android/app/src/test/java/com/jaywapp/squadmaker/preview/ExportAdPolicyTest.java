package com.jaywapp.squadmaker.preview;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertNull;
import static org.junit.Assert.assertTrue;

import org.junit.Test;

public class ExportAdPolicyTest {
    @Test
    public void onlyExportPlacementsAreSupported() {
        assertTrue(ExportAdPolicy.isSupportedPlacement("gif"));
        assertTrue(ExportAdPolicy.isSupportedPlacement("sq"));
        assertFalse(ExportAdPolicy.isSupportedPlacement("share-text"));
        assertFalse(ExportAdPolicy.isSupportedPlacement("share"));
        assertFalse(ExportAdPolicy.isSupportedPlacement("share-gif"));
        assertFalse(ExportAdPolicy.isSupportedPlacement("share-sq"));
        assertFalse(ExportAdPolicy.isSupportedPlacement(null));
        assertFalse(ExportAdPolicy.isSupportedPlacement(""));
        assertFalse(ExportAdPolicy.isSupportedPlacement("png"));
        assertFalse(ExportAdPolicy.isSupportedPlacement("autosave"));
        assertFalse(ExportAdPolicy.isSupportedPlacement("GIF"));
        assertFalse(ExportAdPolicy.isSupportedPlacement(" gif"));
    }

    @Test
    public void firstShowHasNoCooldown() {
        assertNull(ExportAdPolicy.cooldownReason(1_000_000L, 0));
        assertNull(ExportAdPolicy.cooldownReason(1_000_000L, -1));
    }

    @Test
    public void cooldownEndsAtExactlyTenMinutes() {
        long shownAt = 1_000_000L;
        assertEquals("cooldown", ExportAdPolicy.cooldownReason(shownAt, shownAt));
        assertEquals("cooldown", ExportAdPolicy.cooldownReason(shownAt + ExportAdPolicy.COOLDOWN_MS - 1, shownAt));
        assertNull(ExportAdPolicy.cooldownReason(shownAt + ExportAdPolicy.COOLDOWN_MS, shownAt));
        assertNull(ExportAdPolicy.cooldownReason(shownAt + ExportAdPolicy.COOLDOWN_MS + 1, shownAt));
    }

    @Test
    public void oneTimestampAppliesToAllSupportedPlacements() {
        long persistedShownAt = 1_000_000L;
        for (String placement : new String[] { "gif", "sq" }) {
            assertTrue(ExportAdPolicy.isSupportedPlacement(placement));
            assertEquals("cooldown", ExportAdPolicy.cooldownReason(persistedShownAt + 1, persistedShownAt));
        }
    }

    @Test
    public void backwardOrUnavailableClockSkipsWithoutOverflow() {
        assertEquals("clock-back", ExportAdPolicy.cooldownReason(999_999L, 1_000_000L));
        assertEquals("clock-back", ExportAdPolicy.cooldownReason(1, Long.MAX_VALUE));
        assertEquals("clock-unavailable", ExportAdPolicy.cooldownReason(0, 0));
        assertEquals("clock-unavailable", ExportAdPolicy.cooldownReason(-1, 1));
        assertNull(ExportAdPolicy.cooldownReason(Long.MAX_VALUE, 1));
    }

    @Test
    public void cachedAdExpiresAtExactlyOneHour() {
        long loadedAt = 100L;
        assertTrue(ExportAdPolicy.isFresh(loadedAt, loadedAt));
        assertTrue(ExportAdPolicy.isFresh(loadedAt + ExportAdPolicy.MAX_AD_AGE_MS - 1, loadedAt));
        assertFalse(ExportAdPolicy.isFresh(loadedAt + ExportAdPolicy.MAX_AD_AGE_MS, loadedAt));
        assertFalse(ExportAdPolicy.isFresh(loadedAt + ExportAdPolicy.MAX_AD_AGE_MS + 1, loadedAt));
    }

    @Test
    public void invalidCacheClockNeverMakesAnAdFresh() {
        assertFalse(ExportAdPolicy.isFresh(10L, -1L));
        assertFalse(ExportAdPolicy.isFresh(99L, 100L));
        assertFalse(ExportAdPolicy.isFresh(-1L, 0));
        assertFalse(ExportAdPolicy.isFresh(Long.MAX_VALUE, 0));
        assertTrue(ExportAdPolicy.isFresh(Long.MAX_VALUE, Long.MAX_VALUE));
    }
}
