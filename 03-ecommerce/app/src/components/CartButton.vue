<script setup lang="ts">
import { onMounted } from "vue";
import { $cart } from "../stores/cart";
import { formatCartCount, getCartAriaLabel } from "../utils/cart-count";
import { useStore } from "@nanostores/vue";
import { actions } from "astro:actions";

const cartStore = useStore($cart);

onMounted(async () => {
  await actions.cart.getItemCount
    .orThrow()
    .then((result) => {
      $cart.set({ itemCount: result.itemCount });
    })
    .catch((error) => {
      console.error("Error fetching cart item count:", error);
    });
});
</script>

<template>
  <a
    class="cart-button"
    href="/cart"
    :aria-label="getCartAriaLabel(cartStore.itemCount)"
    data-cart-button
  >
    <svg
      class="cart-button__icon"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 640 640"
      width="24"
      height="24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path
        d="M24 48C10.7 48 0 58.7 0 72C0 85.3 10.7 96 24 96L69.3 96C73.2 96 76.5 98.8 77.2 102.6L129.3 388.9C135.5 423.1 165.3 448 200.1 448L456 448C469.3 448 480 437.3 480 424C480 410.7 469.3 400 456 400L200.1 400C188.5 400 178.6 391.7 176.5 380.3L171.4 352L475 352C505.8 352 532.2 330.1 537.9 299.8L568.9 133.9C572.6 114.2 557.5 96 537.4 96L124.7 96L124.3 94C119.5 67.4 96.3 48 69.2 48L24 48zM208 576C234.5 576 256 554.5 256 528C256 501.5 234.5 480 208 480C181.5 480 160 501.5 160 528C160 554.5 181.5 576 208 576zM432 576C458.5 576 480 554.5 480 528C480 501.5 458.5 480 432 480C405.5 480 384 501.5 384 528C384 554.5 405.5 576 432 576z"
      ></path>
    </svg>
    <span
      class="cart-button__badge"
      aria-hidden="true"
      :hidden="cartStore.itemCount === 0"
    >
      {{ formatCartCount(cartStore.itemCount) }}
    </span>
  </a>
</template>

<style>
.cart-button {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  color: var(--color-text);
  border-radius: var(--radius-md);
  transition:
    color 0.15s ease,
    background-color 0.15s ease,
    transform 0.15s ease;
}

.cart-button__icon {
  width: 24px;
  height: 24px;
  display: block;
}

.cart-button:hover {
  color: var(--color-text);
  background-color: var(--color-surface-hover);
  transform: translateY(-1px);
}

.cart-button:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
}

.cart-button__badge {
  position: absolute;
  top: 2px;
  right: 0;
  min-width: 20px;
  height: 20px;
  padding: 0 5px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 0.6875rem;
  font-weight: 700;
  line-height: 1;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
  color: var(--color-primary-contrast);
  background-color: var(--color-primary);
  border: 2px solid var(--color-surface);
  border-radius: 999px;
  pointer-events: none;
}

.cart-button__badge[hidden] {
  display: none;
}
</style>
