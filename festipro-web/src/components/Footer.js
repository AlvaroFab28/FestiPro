export function getFooterHTML() {
    const currentYear = new Date().getFullYear();
    return `
        <div class="spotlight-card bg-slate-50 dark:bg-fp-surface-dark border-t border-slate-200 dark:border-fp-border-dark py-8 transition-colors duration-300 h-full flex items-center">
            <div class="container mx-auto px-6 relative z-20 flex flex-col md:flex-row justify-between items-center gap-4">
                <div class="text-center md:text-left">
                    <span class="text-xl font-display font-bold text-fp-primary-light dark:text-fp-primary-dark">
                        FestiPro<span class="text-fp-accent-light dark:text-fp-accent-dark">.</span>
                    </span>
                    <p class="text-slate-500 dark:text-slate-400 text-sm mt-1">Conectando talento con grandes eventos.</p>
                </div>
                <div class="text-slate-500 dark:text-slate-400 text-sm">
                    &copy; ${currentYear} FestiPro. Todos los derechos reservados.
                </div>
            </div>
        </div>
    `;
}