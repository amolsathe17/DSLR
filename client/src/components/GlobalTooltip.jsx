import { useEffect } from 'react';

export default function GlobalTooltip() {
  useEffect(() => {
    let tooltipEl = document.getElementById('global-portal-tooltip');
    if (!tooltipEl) {
      tooltipEl = document.createElement('div');
      tooltipEl.id = 'global-portal-tooltip';
      document.body.appendChild(tooltipEl);
    }

    const handleMouseOver = (e) => {
      const target = e.target.closest('[data-tooltip]');
      if (!target) return;

      const text = target.getAttribute('data-tooltip');
      if (!text) return;

      tooltipEl.textContent = text;
      tooltipEl.classList.add('visible');

      // Force layout calculation to get correct width/height of the tooltip bubble
      const rect = target.getBoundingClientRect();
      const tooltipRect = tooltipEl.getBoundingClientRect();

      // Center horizontally relative to target element
      const targetCenter = rect.left + rect.width / 2;
      const x = targetCenter - tooltipRect.width / 2;
      
      // Position above the target element
      const y = rect.top - tooltipRect.height - 8;

      // Keep it within screen boundaries with some padding
      const padding = 8;
      const finalX = Math.max(padding, Math.min(window.innerWidth - tooltipRect.width - padding, x));
      
      tooltipEl.style.left = `${finalX + window.scrollX}px`;
      tooltipEl.style.top = `${y + window.scrollY}px`;
    };

    const handleMouseOut = (e) => {
      const target = e.target.closest('[data-tooltip]');
      if (target) {
        tooltipEl.classList.remove('visible');
      }
    };

    // Clean up when mouse leaves screen or clicks
    const handleReset = () => {
      tooltipEl.classList.remove('visible');
    };

    document.addEventListener('mouseover', handleMouseOver);
    document.addEventListener('mouseout', handleMouseOut);
    document.addEventListener('click', handleReset);
    window.addEventListener('resize', handleReset);
    window.addEventListener('scroll', handleReset, true);

    return () => {
      document.removeEventListener('mouseover', handleMouseOver);
      document.removeEventListener('mouseout', handleMouseOut);
      document.removeEventListener('click', handleReset);
      window.removeEventListener('resize', handleReset);
      window.removeEventListener('scroll', handleReset, true);
    };
  }, []);

  return null;
}
