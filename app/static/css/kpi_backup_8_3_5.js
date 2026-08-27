/* =========================================================
   Excel AI Automation
   KPI Dashboard Styles
========================================================= */

.kpi-section {
    width: 100%;
}


/* =========================================================
   KPI CARD
========================================================= */

.kpi-card {

    background: #ffffff;

    border: 1px solid #e9ecef;

    border-radius: 16px;

    padding: 22px;

    min-height: 175px;

    box-shadow:
        0 5px 20px rgba(
            0,
            0,
            0,
            0.06
        );

    transition:
        transform 0.2s ease,
        box-shadow 0.2s ease;

}


.kpi-card:hover {

    transform:
        translateY(-4px);

    box-shadow:
        0 10px 28px rgba(
            0,
            0,
            0,
            0.10
        );

}


/* =========================================================
   TOP
========================================================= */

.kpi-card-top {

    display: flex;

    align-items: center;

    justify-content: space-between;

    margin-bottom: 22px;

}


.kpi-icon {

    width: 48px;

    height: 48px;

    display: flex;

    align-items: center;

    justify-content: center;

    border-radius: 12px;

    background: #f1f5ff;

    font-size: 23px;

}


.kpi-category {

    font-size: 12px;

    font-weight: 600;

    color: #6c757d;

    background: #f8f9fa;

    padding: 5px 9px;

    border-radius: 20px;

}


/* =========================================================
   VALUE
========================================================= */

.kpi-value {

    font-size: 28px;

    font-weight: 700;

    color: #172033;

    line-height: 1.2;

    margin-bottom: 7px;

    word-break: break-word;

}


.kpi-name {

    font-size: 14px;

    color: #6c757d;

    font-weight: 500;

}


/* =========================================================
   LOADING
========================================================= */

.kpi-loading {

    min-height: 160px;

    display: flex;

    flex-direction: column;

    align-items: center;

    justify-content: center;

    color: #6c757d;

}


.kpi-loading .spinner-border {

    margin-bottom: 12px;

}


/* =========================================================
   SUMMARY
========================================================= */

.kpi-summary {

    font-size: 13px;

    color: #6c757d;

}


/* =========================================================
   DARK MODE
========================================================= */

body.dark-mode .kpi-card {

    background: #1e293b;

    border-color: #334155;

}


body.dark-mode .kpi-value {

    color: #f8fafc;

}


body.dark-mode .kpi-name {

    color: #94a3b8;

}


body.dark-mode .kpi-category {

    background: #334155;

    color: #cbd5e1;

}


/* =========================================================
   RESPONSIVE
========================================================= */

@media (
    max-width: 768px
) {

    .kpi-card {

        min-height: 150px;

        padding: 18px;

    }


    .kpi-value {

        font-size: 24px;

    }


    .kpi-summary {

        display: none;

    }

}