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
            document.documentElement.classList.toggle('tsv-nav-open', open);
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
        if (toggle && window.matchMedia(MOBILE_QUERY).matches) {
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
    if (!inBackend) {
        initSchedules();
        initGalleries();
        initLightbox();
    }
})();
