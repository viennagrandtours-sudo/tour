// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import TestimonialCarousel from "./TestimonialCarousel";
import type { Testimonial } from "@/lib/supabase";

const messages = {
  testimonials: {
    carouselLabel: "Testimonials",
    carouselGoTo: "Go to testimonial {number}",
  },
};

const remote: Testimonial[] = [
  { id: "1", author_name: "Anna", rating: 5, quote: "Great tour", locale: "en", published: true },
  { id: "2", author_name: "Ben", rating: 5, quote: "Loved it", locale: "en", published: true },
  { id: "3", author_name: "Cara", rating: 5, quote: "Wonderful", locale: "en", published: true },
];

function renderCarousel() {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <TestimonialCarousel remote={remote} />
    </NextIntlClientProvider>
  );
}

function currentDot(): number {
  const buttons = screen.getAllByRole("button");
  return buttons.findIndex((b) => b.getAttribute("aria-current") === "true");
}

function matchMediaMock(matches: boolean) {
  return vi.fn().mockImplementation((query: string) => ({
    matches,
    media: query,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
}

describe("TestimonialCarousel", () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    window.matchMedia = matchMediaMock(false);
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it("auto-advances to the next testimonial after the rotation interval", async () => {
    renderCarousel();
    expect(currentDot()).toBe(0);

    await vi.advanceTimersByTimeAsync(6000);
    expect(currentDot()).toBe(1);
  });

  it("pauses rotation while the pointer is hovering the carousel, and resumes after", async () => {
    const user = userEvent.setup({ delay: null, advanceTimers: vi.advanceTimersByTime });
    const { container } = renderCarousel();
    const root = container.firstElementChild as HTMLElement;

    await user.hover(root);
    await vi.advanceTimersByTimeAsync(10_000);
    expect(currentDot()).toBe(0); // still paused — no auto-advance while hovered

    await user.unhover(root);
    await vi.advanceTimersByTimeAsync(6000);
    expect(currentDot()).toBe(1); // resumed after the pointer leaves
  });

  it("keeps a manually picked slide for a full rotation instead of jumping immediately", async () => {
    const user = userEvent.setup({ delay: null, advanceTimers: vi.advanceTimersByTime });
    renderCarousel();

    await user.click(screen.getByRole("button", { name: "Go to testimonial 3" }));
    expect(currentDot()).toBe(2);

    // Advancing less than a full interval must not have moved on already.
    await vi.advanceTimersByTimeAsync(5000);
    expect(currentDot()).toBe(2);

    await vi.advanceTimersByTimeAsync(1000);
    expect(currentDot()).toBe(0); // wraps after the full interval elapses
  });

  it("never auto-advances when the system prefers reduced motion", async () => {
    window.matchMedia = matchMediaMock(true);
    renderCarousel();

    await vi.advanceTimersByTimeAsync(30_000);
    expect(currentDot()).toBe(0);
  });
});
