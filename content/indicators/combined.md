---
title: Combined
category: active
order: 80
---

The “Combined” map represents a combination of all the indicators currently featured on the public map. As of this writing, this includes Doctor Visits, Symptoms (Facebook), Symptoms in Community (Facebook), and Search Trends. It does not include official reports (cases and deaths), hospital admissions, or SafeGraph signals. We use a rank-1 approximation, from a nonnegative matrix factorization approach, to identify an underlying signal that best reconstructs the indicators. Higher values of the combined signal correspond to higher values of the other indicators, but the scale (units) of the combination is arbitrary.
