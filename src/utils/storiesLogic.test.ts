import assert from "node:assert";
import {
  isProfileStoriesEnabled,
  isGenuineStoreStoryRecord,
  isStoreStoryPublishedAndActive,
  getRawPublishedStoreStories,
  getVisibleProfileStoreStories,
  shouldDisplayProfileStoriesInterface,
  StoreStoryRecord,
} from "./storiesLogic";
import { resolveUserFromForm } from "./accountFlowLogic";

const NOW = 1_762_000_000_000;

function createMockStore(id: string, overrides: Record<string, any> = {}) {
  return {
    id,
    name: `Store ${id}`,
    ownerEmail: `${id}@yume.dz`,
    banner: "https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?w=800",
    logo: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=200",
    products: [
      {
        id: `${id}_prod_1`,
        name: "Product 1",
        price: 4500,
        imageUrl: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600",
      },
      {
        id: `${id}_prod_2`,
        name: "Product 2",
        price: 6800,
        imageUrl: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600",
      },
      {
        id: `${id}_prod_3`,
        name: "Product 3",
        price: 9200,
        imageUrl: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600",
      },
      {
        id: `${id}_prod_4`,
        name: "Product 4",
        price: 12000,
        imageUrl: "https://images.unsplash.com/photo-1585386959984-a4155224a1ad?w=600",
      },
    ],
    ...overrides,
  };
}

function createPublishedStory(
  id: string,
  storeId: string,
  overrides: Partial<StoreStoryRecord> = {}
): StoreStoryRecord {
  return {
    id,
    storeId,
    source: "store_story",
    type: "image",
    url: `https://cdn.yume.dz/stories/${id}.jpg`,
    imageUrl: `https://cdn.yume.dz/stories/${id}.jpg`,
    mediaUrl: `https://cdn.yume.dz/stories/${id}.jpg`,
    text: `Story headline ${id}`,
    description: `Story description ${id}`,
    hashtags: "#yume #official",
    productId: `${storeId}_prod_1`,
    productName: "Product 1",
    status: "published",
    createdAt: NOW - 3600 * 1000,
    publishedAt: NOW - 3600 * 1000,
    durationHours: 24,
    expiresAt: NOW + 23 * 3600 * 1000,
    ...overrides,
  };
}

export function runAllStoriesTests() {
  const results: { testId: string; title: string; passed: boolean; details: string }[] = [];

  // =========================================================================
  // TEST 1: New profile created -> Stories disabled -> No Stories section shown
  // =========================================================================
  {
    const newMerchantUser = resolveUserFromForm({
      mode: "register",
      accountType: "merchant",
      email: "newmerchant@yume.dz",
      fullName: "New Merchant",
      storeName: "New Store",
    });
    const newPersonalUser = resolveUserFromForm({
      mode: "register",
      accountType: "buyer",
      email: "newbuyer@yume.dz",
      fullName: "New Buyer",
    });
    const newStore = createMockStore("store_new_1");
    const customStoriesByStore: Record<string, any> = {};
    const deletedStoryIdsByStore: Record<string, string[]> = {};
    const storiesEnabledByStore: Record<string, boolean> = {};

    const isEnabled = isProfileStoriesEnabled(newStore, storiesEnabledByStore);
    const visibleStories = getVisibleProfileStoreStories(
      newStore,
      customStoriesByStore,
      deletedStoryIdsByStore,
      storiesEnabledByStore,
      NOW
    );
    const showInterface = shouldDisplayProfileStoriesInterface(
      newStore,
      customStoriesByStore,
      deletedStoryIdsByStore,
      storiesEnabledByStore,
      NOW
    );

    assert.strictEqual(newMerchantUser.storiesEnabled, false, "New merchant user must have storiesEnabled = false");
    assert.strictEqual(newPersonalUser.storiesEnabled, false, "New personal customer user must have storiesEnabled = false");
    assert.strictEqual(isEnabled, false, "New store profile must have Stories disabled by default");
    assert.strictEqual(visibleStories.length, 0, "New store profile must return 0 visible stories");
    assert.strictEqual(showInterface, false, "No Stories section or ring may be displayed");

    results.push({
      testId: "TEST 1",
      title: "New profile created",
      passed: true,
      details: `storiesEnabled=${isEnabled}, visibleStories=${visibleStories.length}, showStoriesInterface=${showInterface}`,
    });
  }

  // =========================================================================
  // TEST 2: Existing profile with products and no Stories -> Stories disabled -> No automatic product Stories shown
  // =========================================================================
  {
    const existingStore = createMockStore("store_existing_with_4_products");
    const customStoriesByStore: Record<string, any> = {};
    const deletedStoryIdsByStore: Record<string, string[]> = {};
    const storiesEnabledByStore: Record<string, boolean> = {};

    const isEnabled = isProfileStoriesEnabled(existingStore, storiesEnabledByStore);
    const visibleStories = getVisibleProfileStoreStories(
      existingStore,
      customStoriesByStore,
      deletedStoryIdsByStore,
      storiesEnabledByStore,
      NOW
    );
    const rawPublished = getRawPublishedStoreStories(
      existingStore,
      customStoriesByStore,
      deletedStoryIdsByStore,
      NOW
    );

    assert.strictEqual(existingStore.products.length, 4, "Store has 4 products");
    assert.strictEqual(isEnabled, false, "Existing store has Stories disabled by default");
    assert.strictEqual(rawPublished.length, 0, "0 automatic product stories generated in raw query");
    assert.strictEqual(visibleStories.length, 0, "0 stories displayed on profile");

    results.push({
      testId: "TEST 2",
      title: "Existing profile with products and no Stories",
      passed: true,
      details: `storeProducts=${existingStore.products.length}, storiesEnabled=${isEnabled}, automaticProductStories=${rawPublished.length}, visibleStories=${visibleStories.length}`,
    });
  }

  // =========================================================================
  // TEST 3: Profile with Stories enabled and 0 published Stories -> No Stories section shown
  // =========================================================================
  {
    const store = createMockStore("store_enabled_zero_stories", { storiesEnabled: true });
    // Even if there is a draft or future scheduled story or legacy auto-generated default_prod_ story, published count is 0:
    const customStoriesByStore: Record<string, any> = {
      [store.id]: [
        createPublishedStory("draft_1", store.id, { status: "draft" }),
        createPublishedStory("scheduled_future", store.id, {
          status: "scheduled",
          scheduledAt: NOW + 7200 * 1000,
        }),
        { id: "default_prod_1", type: "image", url: store.products[0].imageUrl, text: "Auto Product" },
        null,
      ],
    };
    const deletedStoryIdsByStore: Record<string, string[]> = {};
    const storiesEnabledByStore: Record<string, boolean> = { [store.id]: true };

    const isEnabled = isProfileStoriesEnabled(store, storiesEnabledByStore);
    const visibleStories = getVisibleProfileStoreStories(
      store,
      customStoriesByStore,
      deletedStoryIdsByStore,
      storiesEnabledByStore,
      NOW
    );
    const showInterface = shouldDisplayProfileStoriesInterface(
      store,
      customStoriesByStore,
      deletedStoryIdsByStore,
      storiesEnabledByStore,
      NOW
    );

    assert.strictEqual(isEnabled, true, "Stories are explicitly enabled");
    assert.strictEqual(visibleStories.length, 0, "0 published active stories exist");
    assert.strictEqual(showInterface, false, "Stories section and ring must remain hidden when 0 published stories exist");

    results.push({
      testId: "TEST 3",
      title: "Profile with Stories enabled and 0 published Stories",
      passed: true,
      details: `storiesEnabled=${isEnabled}, publishedActiveStories=${visibleStories.length}, showStoriesInterface=${showInterface}`,
    });
  }

  // =========================================================================
  // TEST 4: Profile with Stories enabled and 1 published Story -> Exactly 1 Story shown
  // =========================================================================
  {
    const store = createMockStore("store_1_story", { storiesEnabled: true });
    const s1 = createPublishedStory("story_1", store.id);
    const customStoriesByStore: Record<string, any> = {
      [store.id]: [s1, null, null, null],
    };
    const deletedStoryIdsByStore: Record<string, string[]> = {};
    const storiesEnabledByStore: Record<string, boolean> = { [store.id]: true };

    const visibleStories = getVisibleProfileStoreStories(
      store,
      customStoriesByStore,
      deletedStoryIdsByStore,
      storiesEnabledByStore,
      NOW
    );
    const showInterface = shouldDisplayProfileStoriesInterface(
      store,
      customStoriesByStore,
      deletedStoryIdsByStore,
      storiesEnabledByStore,
      NOW
    );

    assert.strictEqual(visibleStories.length, 1, "Must display elaborarly 1 story");
    assert.strictEqual(visibleStories[0].id, "story_1", "Displayed story ID must match story_1");
    assert.strictEqual(showInterface, true, "Stories interface must be shown");

    results.push({
      testId: "TEST 4",
      title: "Profile with Stories enabled and 1 published Story",
      passed: true,
      details: `visibleStoriesCount=${visibleStories.length} (IDs: ${visibleStories.map((s) => s.id).join(", ")})`,
    });
  }

  // =========================================================================
  // TEST 5: Profile with Stories enabled and 2 published Stories -> Exactly 2 Stories shown
  // =========================================================================
  {
    const store = createMockStore("store_2_stories", { storiesEnabled: true });
    const s1 = createPublishedStory("story_1", store.id);
    const s2 = createPublishedStory("story_2", store.id, { type: "text", text: "Flash announcement", url: "" });
    const customStoriesByStore: Record<string, any> = {
      [store.id]: [s1, s2, null, null],
    };
    const deletedStoryIdsByStore: Record<string, string[]> = {};
    const storiesEnabledByStore: Record<string, boolean> = { [store.id]: true };

    const visibleStories = getVisibleProfileStoreStories(
      store,
      customStoriesByStore,
      deletedStoryIdsByStore,
      storiesEnabledByStore,
      NOW
    );

    assert.strictEqual(visibleStories.length, 2, "Must display exactly 2 stories");
    assert.deepStrictEqual(
      visibleStories.map((s) => s.id),
      ["story_1", "story_2"]
    );

    results.push({
      testId: "TEST 5",
      title: "Profile with Stories enabled and 2 published Stories",
      passed: true,
      details: `visibleStoriesCount=${visibleStories.length} (IDs: ${visibleStories.map((s) => s.id).join(", ")})`,
    });
  }

  // =========================================================================
  // TEST 6: Profile with Stories enabled and 3 published Stories -> Exactly 3 Stories shown
  // =========================================================================
  {
    const store = createMockStore("store_3_stories", { storiesEnabled: true });
    const s1 = createPublishedStory("story_1", store.id);
    const s2 = createPublishedStory("story_2", store.id);
    const s3 = createPublishedStory("story_3", store.id, {
      type: "video",
      url: "https://cdn.yume.dz/stories/video3.mp4",
    });
    const customStoriesByStore: Record<string, any> = {
      [store.id]: [s1, s2, s3, null],
    };
    const deletedStoryIdsByStore: Record<string, string[]> = {};
    const storiesEnabledByStore: Record<string, boolean> = { [store.id]: true };

    const visibleStories = getVisibleProfileStoreStories(
      store,
      customStoriesByStore,
      deletedStoryIdsByStore,
      storiesEnabledByStore,
      NOW
    );

    assert.strictEqual(visibleStories.length, 3, "Must display exactly 3 stories");
    assert.deepStrictEqual(
      visibleStories.map((s) => s.id),
      ["story_1", "story_2", "story_3"]
    );

    results.push({
      testId: "TEST 6",
      title: "Profile with Stories enabled and 3 published Stories",
      passed: true,
      details: `visibleStoriesCount=${visibleStories.length} (IDs: ${visibleStories.map((s) => s.id).join(", ")})`,
    });
  }

  // =========================================================================
  // TEST 7: Profile with Stories enabled and 4 published Stories -> Exactly 4 Stories shown
  // =========================================================================
  {
    const store = createMockStore("store_4_stories", { storiesEnabled: true });
    const s1 = createPublishedStory("story_1", store.id);
    const s2 = createPublishedStory("story_2", store.id);
    const s3 = createPublishedStory("story_3", store.id);
    const s4 = createPublishedStory("story_4", store.id);
    const customStoriesByStore: Record<string, any> = {
      [store.id]: [s1, s2, s3, s4],
    };
    const deletedStoryIdsByStore: Record<string, string[]> = {};
    const storiesEnabledByStore: Record<string, boolean> = { [store.id]: true };

    const visibleStories = getVisibleProfileStoreStories(
      store,
      customStoriesByStore,
      deletedStoryIdsByStore,
      storiesEnabledByStore,
      NOW
    );

    assert.strictEqual(visibleStories.length, 4, "Must display exactly 4 stories");
    assert.deepStrictEqual(
      visibleStories.map((s) => s.id),
      ["story_1", "story_2", "story_3", "story_4"]
    );

    results.push({
      testId: "TEST 7",
      title: "Profile with Stories enabled and 4 published Stories",
      passed: true,
      details: `visibleStoriesCount=${visibleStories.length} (IDs: ${visibleStories.map((s) => s.id).join(", ")})`,
    });
  }

  // =========================================================================
  // TEST 8: Adding a new product to a store -> Product appears in products only -> Product does NOT appear in Stories
  // =========================================================================
  {
    const store = createMockStore("store_product_addition", { storiesEnabled: true });
    const s1 = createPublishedStory("story_1", store.id);
    const customStoriesByStore: Record<string, any> = {
      [store.id]: [s1, null, null, null],
    };
    const deletedStoryIdsByStore: Record<string, string[]> = {};
    const storiesEnabledByStore: Record<string, boolean> = { [store.id]: true };

    const beforeStories = getVisibleProfileStoreStories(
      store,
      customStoriesByStore,
      deletedStoryIdsByStore,
      storiesEnabledByStore,
      NOW
    );
    assert.strictEqual(beforeStories.length, 1);

    // Merchant publishes a brand-new product with gallery images and promotional discount
    const newProduct = {
      id: "new_product_99",
      name: "Handcrafted Atlas Ceramic Vase",
      price: 7500,
      discountPercent: 20,
      isFeatured: true,
      imageUrl: "https://cdn.yume.dz/products/vase_main.jpg",
      gallery: [
        "https://cdn.yume.dz/products/vase_1.jpg",
        "https://cdn.yume.dz/products/vase_2.jpg",
      ],
    };
    const updatedStore = {
      ...store,
      products: [newProduct, ...store.products],
    };

    const afterStories = getVisibleProfileStoreStories(
      updatedStore,
      customStoriesByStore,
      deletedStoryIdsByStore,
      storiesEnabledByStore,
      NOW
    );

    assert.strictEqual(updatedStore.products.length, 5, "New product added to store products list");
    assert.strictEqual(afterStories.length, 1, "Stories count remains 1; new product is NOT added to Stories");
    assert.strictEqual(
      afterStories.some((s) => s.url === newProduct.imageUrl || s.id.includes(newProduct.id)),
      false,
      "New product media never leaks into Store Stories"
    );

    results.push({
      testId: "TEST 8",
      title: "Adding a new product to a store",
      passed: true,
      details: `storeProductsBefore=4, storeProductsAfter=${updatedStore.products.length}, storiesBefore=${beforeStories.length}, storiesAfter=${afterStories.length}`,
    });
  }

  // =========================================================================
  // TEST 9: Disabling Stories on a profile with existing Stories -> Stories section hidden -> Existing Story records preserved
  // =========================================================================
  {
    const store = createMockStore("store_disable_preserve", { storiesEnabled: true });
    const s1 = createPublishedStory("story_preserve_1", store.id);
    const s2 = createPublishedStory("story_preserve_2", store.id);
    const customStoriesByStore: Record<string, any> = {
      [store.id]: [s1, s2, null, null],
    };
    const deletedStoryIdsByStore: Record<string, string[]> = {};
    const storiesEnabledByStore: Record<string, boolean> = { [store.id]: true };

    // Verify visible while enabled
    const visibleWhileEnabled = getVisibleProfileStoreStories(
      store,
      customStoriesByStore,
      deletedStoryIdsByStore,
      storiesEnabledByStore,
      NOW
    );
    assert.strictEqual(visibleWhileEnabled.length, 2, "2 stories visible while enabled");

    // Disable Stories for this store
    storiesEnabledByStore[store.id] = false;
    const disabledStore = { ...store, storiesEnabled: false };

    const visibleWhileDisabled = getVisibleProfileStoreStories(
      disabledStore,
      customStoriesByStore,
      deletedStoryIdsByStore,
      storiesEnabledByStore,
      NOW
    );
    const showInterfaceWhileDisabled = shouldDisplayProfileStoriesInterface(
      disabledStore,
      customStoriesByStore,
      deletedStoryIdsByStore,
      storiesEnabledByStore,
      NOW
    );
    const preservedStoredRecords = getRawPublishedStoreStories(
      disabledStore,
      customStoriesByStore,
      deletedStoryIdsByStore,
      NOW
    );

    assert.strictEqual(visibleWhileDisabled.length, 0, "0 stories displayed publicly when disabled");
    assert.strictEqual(showInterfaceWhileDisabled, false, "Stories section and ring hidden when disabled");
    assert.strictEqual(preservedStoredRecords.length, 2, "Both existing Story records remain intact in storage");
    assert.strictEqual(preservedStoredRecords[0].id, "story_preserve_1");
    assert.strictEqual(preservedStoredRecords[0].description, "Story description story_preserve_1");
    assert.strictEqual(preservedStoredRecords[0].hashtags, "#yume #official");
    assert.strictEqual(preservedStoredRecords[0].productId, `${store.id}_prod_1`);
    assert.strictEqual(preservedStoredRecords[1].id, "story_preserve_2");

    results.push({
      testId: "TEST 9",
      title: "Disabling Stories on a profile with existing Stories",
      passed: true,
      details: `visibleWhileDisabled=${visibleWhileDisabled.length}, showInterface=${showInterfaceWhileDisabled}, preservedRecordsInStorage=${preservedStoredRecords.length}`,
    });
  }

  // =========================================================================
  // TEST 10: Re-enabling Stories on that profile -> Existing valid Stories appear again
  // =========================================================================
  {
    const store = createMockStore("store_disable_preserve", { storiesEnabled: false });
    const s1 = createPublishedStory("story_preserve_1", store.id);
    const s2 = createPublishedStory("story_preserve_2", store.id);
    const customStoriesByStore: Record<string, any> = {
      [store.id]: [s1, s2, null, null],
    };
    const deletedStoryIdsByStore: Record<string, string[]> = {};
    const storiesEnabledByStore: Record<string, boolean> = { [store.id]: false };

    // Re-enable Stories
    storiesEnabledByStore[store.id] = true;
    const reEnabledStore = { ...store, storiesEnabled: true };

    const visibleAfterReEnable = getVisibleProfileStoreStories(
      reEnabledStore,
      customStoriesByStore,
      deletedStoryIdsByStore,
      storiesEnabledByStore,
      NOW
    );
    const showInterfaceAfterReEnable = shouldDisplayProfileStoriesInterface(
      reEnabledStore,
      customStoriesByStore,
      deletedStoryIdsByStore,
      storiesEnabledByStore,
      NOW
    );

    assert.strictEqual(showInterfaceAfterReEnable, true, "Stories interface restored after re-enabling");
    assert.strictEqual(visibleAfterReEnable.length, 2, "Both existing valid stories appear again immediately");
    assert.deepStrictEqual(
      visibleAfterReEnable.map((s) => s.id),
      ["story_preserve_1", "story_preserve_2"]
    );

    results.push({
      testId: "TEST 10",
      title: "Re-enabling Stories on that profile",
      passed: true,
      details: `showInterface=${showInterfaceAfterReEnable}, restoredStoriesCount=${visibleAfterReEnable.length} (IDs: ${visibleAfterReEnable.map((s) => s.id).join(", ")})`,
    });
  }

  return results;
}

const testResults = runAllStoriesTests();
console.log("==================================================");
console.log("YUME STORIES SYSTEM VERIFICATION SUITE (TESTS 1-10)");
console.log("==================================================");
for (const r of testResults) {
  console.log(`[PASS] ${r.testId}: ${r.title} -> ${r.details}`);
}
console.log("==================================================");
console.log(`ALL ${testResults.length}/10 TESTS PASSED SUCCESSFULLY.`);
