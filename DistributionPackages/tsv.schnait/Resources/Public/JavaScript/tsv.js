/*
 * TSV Schnait – Frontend-Script (ohne Abhängigkeiten außer GLightbox für die Bildergalerie)
 */
(function () {
    'use strict';

    var MOBILE_QUERY = '(max-width: 767px)';
    var inBackend = document.body.classList.contains('neos-backend');

    /* ---------- Navigation ---------- */
    function initNavigation() {
        var nav = document.querySelector('.tsv-nav');
        if (!nav) {
            return;
        }
        var toggle = nav.querySelector('.tsv-nav__toggle');
        var header = nav.closest('.navigation');

        function closeSubmenus(except) {
            nav.querySelectorAll('.tsv-nav__item.is-open').forEach(function (item) {
                if (except && item.contains(except)) {
                    return;
                }
                item.classList.remove('is-open');
                var button = item.querySelector(':scope > .tsv-nav__subtoggle');
                if (button) {
                    button.setAttribute('aria-expanded', 'false');
                }
            });
        }

        function setMenuOpen(open) {
            nav.classList.toggle('is-open', open);
            toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
            if (!open) {
                closeSubmenus();
            }
        }

        if (toggle) {
            toggle.addEventListener('click', function () {
                setMenuOpen(!nav.classList.contains('is-open'));
            });
        }

        nav.querySelectorAll('.tsv-nav__subtoggle').forEach(function (button) {
            button.addEventListener('click', function () {
                var item = button.parentElement;
                var open = !item.classList.contains('is-open');
                closeSubmenus(item);
                item.classList.toggle('is-open', open);
                button.setAttribute('aria-expanded', open ? 'true' : 'false');
            });
        });

        // Auf dem Handy den Bereich der aktuellen Seite bereits aufgeklappt zeigen
        if (toggle && !inBackend && window.matchMedia(MOBILE_QUERY).matches) {
            nav.querySelectorAll('.tsv-nav__item--active.has-children').forEach(function (item) {
                item.classList.add('is-open');
                item.querySelector(':scope > .tsv-nav__subtoggle').setAttribute('aria-expanded', 'true');
            });
        }

        document.addEventListener('keydown', function (event) {
            if (event.key !== 'Escape') {
                return;
            }
            if (nav.classList.contains('is-open')) {
                setMenuOpen(false);
                toggle.focus();
            } else {
                closeSubmenus();
            }
        });

        document.addEventListener('click', function (event) {
            if (!nav.contains(event.target)) {
                if (nav.classList.contains('is-open')) {
                    setMenuOpen(false);
                } else {
                    closeSubmenus();
                }
            }
        });

        // Beim Wechsel auf die Desktop-Ansicht ein offenes Handy-Menü zurücksetzen
        window.matchMedia(MOBILE_QUERY).addEventListener('change', function () {
            setMenuOpen(false);
        });

        if (header) {
            var onScroll = function () {
                header.classList.toggle('is-scrolled', window.scrollY > 8);
            };
            window.addEventListener('scroll', onScroll, {passive: true});
            onScroll();
        }
    }

    /* ---------- Neos-Backend: immer das Desktop-Layout zeigen ----------
     * Der Vorschaurahmen im Backend ist oft schmaler als 768px. Damit Spalten und Stundenplan dort
     * nebeneinander pflegbar bleiben, werden die breitenabhängigen Media-Regeln der eigenen Stylesheets
     * so ausgewertet, als wäre der Rahmen mindestens 768px breit; die Seite wird passend verkleinert.
     */
    function initBackendDesktopLayout() {
        var MIN_WIDTH = 768;
        var wrapper = document.getElementById('wrapper');
        var rules = [];

        function collect(list) {
            Array.prototype.forEach.call(list, function (rule) {
                if (rule.type === CSSRule.MEDIA_RULE) {
                    if (/width/.test(rule.media.mediaText)) {
                        rules.push({rule: rule, original: rule.media.mediaText});
                    }
                    collect(rule.cssRules);
                }
            });
        }

        Array.prototype.forEach.call(document.styleSheets, function (sheet) {
            if (!sheet.href || sheet.href.indexOf('/tsv.schnait/') === -1) {
                return;
            }
            try {
                collect(sheet.cssRules);
            } catch (e) { /* Stylesheet nicht lesbar – überspringen */ }
        });

        function matchesAt(mediaText, width) {
            // genügt für die hier verwendeten Regeln: Kombinationen aus min-width/max-width in px
            return mediaText.split(',').some(function (query) {
                var ok = true;
                query.replace(/\((min|max)-width:\s*([\d.]+)px\)/g, function (match, kind, value) {
                    value = parseFloat(value);
                    ok = ok && (kind === 'min' ? width >= value : width <= value);
                });
                return ok;
            });
        }

        function apply() {
            var frameWidth = document.documentElement.clientWidth;
            var narrow = frameWidth < MIN_WIDTH;
            rules.forEach(function (entry) {
                var text = entry.original;
                if (narrow) {
                    text = matchesAt(entry.original, MIN_WIDTH) ? 'all' : 'not all';
                }
                if (entry.rule.media.mediaText !== text) {
                    entry.rule.media.mediaText = text;
                }
            });
            if (wrapper) {
                wrapper.style.minWidth = narrow ? MIN_WIDTH + 'px' : '';
                wrapper.style.zoom = narrow ? String(frameWidth / MIN_WIDTH) : '';
            }
        }

        apply();
        window.addEventListener('resize', apply);
    }

    /* ---------- Stundenplan: Wochentage für die Handy-Ansicht an die Spalten schreiben ---------- */
    function isFiveColumnRow(element) {
        return !!element && element.classList.contains('typo3-neos-nodetypes-fivecolumn');
    }

    function columnsOf(row) {
        return Array.prototype.filter.call(row.children, function (child) {
            return child.classList.contains('col-sm-15');
        });
    }

    // Kopfzeile = jede befüllte Spalte enthält genau eine Überschrift und sonst nichts
    function headLabels(row) {
        var labels = [];
        var filled = 0;
        var columns = columnsOf(row);
        for (var i = 0; i < columns.length; i++) {
            var collection = columns[i].querySelector('.neos-contentcollection') || columns[i];
            var elements = collection.children;
            var text = collection.textContent.replace(/\s+/g, ' ').trim();
            if (text === '') {
                labels.push('');
                continue;
            }
            if (elements.length !== 1 || !/^H[1-6]$/.test(elements[0].tagName)) {
                return null;
            }
            labels.push(text);
            filled++;
        }
        return filled >= 2 ? labels : null;
    }

    function initSchedules() {
        document.querySelectorAll('.typo3-neos-nodetypes-fivecolumn').forEach(function (row) {
            if (row.classList.contains('is-schedule-body')) {
                return;
            }
            var labels = headLabels(row);
            if (!labels || !isFiveColumnRow(row.nextElementSibling) || headLabels(row.nextElementSibling)) {
                return;
            }
            row.classList.add('is-schedule-head');

            var body = row.nextElementSibling;
            while (isFiveColumnRow(body) && !headLabels(body)) {
                body.classList.add('is-schedule-body');
                columnsOf(body).forEach(function (column, index) {
                    if (labels[index]) {
                        column.setAttribute('data-day', labels[index]);
                    }
                });
                // Leerzeilen, die am Rechner nur die Kastenhöhe angleichen, mobil ausblenden
                body.querySelectorAll('p').forEach(function (paragraph) {
                    if (paragraph.textContent.replace(/ /g, ' ').trim() === '' && !paragraph.querySelector('img')) {
                        paragraph.classList.add('tsv-empty');
                    }
                });
                body = body.nextElementSibling;
            }
        });
    }

    /* ---------- Galerie: Zeilen, die ausschließlich Lightbox-Bilder enthalten ---------- */
    function initGalleries() {
        document.querySelectorAll('.content .row').forEach(function (row) {
            var filled = 0;
            var onlyImages = Array.prototype.every.call(row.children, function (column) {
                var collection = column.querySelector('.neos-contentcollection');
                if (!collection || collection.children.length === 0) {
                    return true;
                }
                filled++;
                return Array.prototype.every.call(collection.children, function (element) {
                    return element.classList.contains('tsv-schnait-fancyimage');
                });
            });
            if (onlyImages && filled >= 2) {
                row.classList.add('is-gallery');
            }
        });
    }

    /* ---------- Graue Titelzeilen (Überschrift | Datum): auf dem Handy steht das Datum klein über dem Titel ---------- */
    function initTitleBars() {
        document.querySelectorAll('.typo3-neos-nodetypes-twocolumngrey').forEach(function (row) {
            if (row.children.length !== 2) {
                return;
            }
            var title = row.children[0].querySelector(':scope > .neos-contentcollection');
            var meta = row.children[1].querySelector(':scope > .neos-contentcollection');
            if (!title || !meta || title.children.length !== 1 || meta.children.length !== 1) {
                return;
            }
            var heading = title.children[0];
            var isHeading = /^H[1-6]$/.test(heading.tagName) || heading.classList.contains('tsv-headline');
            var text = meta.textContent.replace(/\s+/g, ' ').trim();
            if (isHeading && text !== '' && text.length <= 60 && !meta.querySelector('img')) {
                row.classList.add('is-titlebar');
            }
        });
    }

    function initLightbox() {
        if (typeof window.GLightbox !== 'function') {
            return;
        }
        window.GLightbox({
            selector: '.tsv-schnait-fancyimage a',
            touchNavigation: true,
            loop: false
        });
    }

    initNavigation();
    if (inBackend) {
        initBackendDesktopLayout();
    } else {
        initSchedules();
        initGalleries();
        initTitleBars();
        initLightbox();
    }
})();
