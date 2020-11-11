---
title: Delphi's COVID-19 Surveys
---

In collaboration with Facebook, along with a consortium of universities and public health officials, the [Delphi group](https://delphi.cmu.edu/) at [Carnegie Mellon University](https://www.cmu.edu/) conducts research surveys to monitor the spread and impact of the COVID-19 pandemic in the United States. This survey is advertised through Facebook. It has run continuously since early April 2020, and about 70,000 people in the United States participate **every day**. Survey results are publicly available on our [COVIDcast map](https://covidcast.cmu.edu/index.html) and in our [COVIDcast API](https://cmu-delphi.github.io/delphi-epidata/api/covidcast.html).

Such detailed data has never before been available during a public health emergency, and it will help public health officials understand how to save lives and how to safely reopen public life. The data will also help researchers understand the social, economic, and health effects of the COVID-19 pandemic.

An international version of the survey is conducted by the University of Maryland in collaboration with Facebook. Its data [is available separately](https://covidmap.umd.edu/). MIT also conducts a global [Beliefs, Behaviors and Norms survey](https://covidsurvey.mit.edu/), also through Facebook, whose data is available for research.

**New!** The [Symptom Data Challenge](https://www.symptomchallenge.org/) challenges participants to enable earlier detection and improved situational awareness of the COVID-19 outbreak by using data from these symptom surveys. Submissions are due by Tuesday, October 6th, 2020, and finalists are eligible to win cash prizes. See [the challenge website](https://www.symptomchallenge.org/) for more details.


## What are the surveys for?

The survey asks respondents whether they are experiencing any symptoms, then asks a series of questions designed to help researchers understand the spread of COVID-19 and its effect on people in the United States. These include questions about COVID-19 testing, prior medical conditions, social distancing measures, mental health, demographics, and the economic effects of the pandemic.

Delphi uses information from the survey as part of its public [COVIDcast map](https://covidcast.cmu.edu/index.html), to inform its forecasts (currently in development) of the pandemic’s spread, and to assist public health agency partners. By providing daily data from all parts of the United States, the survey allows comparisons between regions and allows careful tracking of changes over time. Other researchers use the survey to study factors related to the pandemic's spread, its effects on mental health, how different demographic groups are affected by the pandemic, and numerous other important questions.

Because the survey can reach thousands of respondents every day, its questions focus on what the respondents are experiencing right now. This allows us to track how conditions change across the country every day.


## Who is running these surveys?

The surveys are a collaboration between [Delphi](https://delphi.cmu.edu/) at Carnegie Mellon University, numerous universities, and Facebook. Researchers at many institutions are analyzing the survey data and assisting in the survey’s development.

The survey protocol has been reviewed by the Carnegie Mellon University Institutional Review Board. Delphi only publicly releases aggregate data; de-identified individual data is made available to research partners. Our partners are bound by data use agreements to maintain the confidentiality of individual survey responses. Facebook refers its users to the survey, but it does not receive any individual survey data.


## How are the surveys distributed?

Participants are recruited for the surveys through an advertisement placed in their Facebook news feed. Facebook automatically selects a random sample of its users to see the advertisement; users who click on the ad are taken to a survey administered by Carnegie Mellon University, and Facebook does not see their survey responses. The survey is available in English, Spanish, Brazilian Portuguese, Vietnamese, French, and simplified Chinese.

The survey participants are sampled from Facebook users, rather than being a random sample from the entire United States population. But unlike a traditional telephone or mail survey, distribution through Facebook allows us to reach tens of thousands of respondents every day, permitting researchers to make comparisons between many geographic areas and to detect changes as soon as they happen.

To account for the differences between Facebook users and the United States population, Facebook includes a unique identifier when it links users to the survey. Carnegie Mellon collects these identifiers and provides Facebook with a list of identifiers that completed the survey; Facebook then calculates statistical weights indicating how representative each person is of the United States population, based on demographic data known to Facebook. Crucially, Carnegie Mellon cannot use these identifiers to identify specific Facebook users, and Facebook never receives individual survey responses and cannot link them to specific users.


## Where can I see the results?

Our [COVIDcast map](https://covidcast.cmu.edu/) shows basic aggregate survey results, revealing the rate of COVID-like symptoms across the United States, and this data is also freely available for download through the [COVIDcast API](https://cmu-delphi.github.io/delphi-epidata/api/covidcast.html). Facebook also publishes [a map](https://covid-survey.dataforgood.fb.com/) based on the United States and international aggregate data.


### Blog posts and presentations

- Ryan Tibshirani, September 21, 2020. [Can Symptom Surveys Improve COVID-19 Forecasts?](https://delphi.cmu.edu/blog/2020/09/21/can-symptoms-surveys-improve-covid-19-forecasts/) Delphi blog.
- Alex Reinhart and Ryan Tibshirani, August 26, 2020. [COVID-19 Symptom Surveys through Facebook](https://delphi.cmu.edu/blog/2020/08/26/covid-19-symptom-surveys-through-facebook/). Delphi blog.

### Publications

Research results from universities studying the survey data will be listed here as soon as they are available.

- Kreuter, F., Barkay, N., Bilinski, A., Bradford, A., Chiu, S., Eliat, R., Fan, J., Galili, T., Haimovich, D., Kim, B., LaRocca, S., Li, Y., Morris, K., Presser, S., Sarig, T., Salomon, J. A., Stewart, K., Stuart, E. A., & Tibshirani, R. J. (2020). [Partnering with a global platform to inform research and public policy making](https://doi.org/10.18148/srm/2020.v14i2.7761). Survey Research Methods, 14(2), 159-163.

If you have used the survey data, or the aggregate data available in the COVIDcast API, to publish research results, please [contact us](#who-can-i-contact) so we can include your work here.

## Can I use the surveys in my research?

Yes! Aggregate data is available for download through the [COVIDcast API](https://cmu-delphi.github.io/delphi-epidata/api/covidcast.html), updated daily, and is archived in the [Amazon Web Services data lake](https://aws.amazon.com/covid-19-data-lake/). [R and Python clients are available](https://cmu-delphi.github.io/delphi-epidata/api/covidcast_clients.html) for the API. Aggregate data does not include any individual survey responses, only averages over counties and other geographic areas, and does not include all survey questions. See the [API documentation](https://cmu-delphi.github.io/delphi-epidata/api/covidcast-signals/fb-survey.html) for details on how to access the data, what survey questions are available, and how our aggregate values are calculated. We recommend that everyone using the COVIDcast API [subscribe to our mailing list](https://lists.andrew.cmu.edu/mailman/listinfo/delphi-covidcast-api) for updates on the API and the data it includes.

Access to de-identified individual survey responses is available to qualified research groups who sign Data Use Agreements protecting the confidentiality of survey responses. If you are interested in using the data for your research, you can [start the process by submitting this form requesting a DUA from Facebook](https://dataforgood.fb.com/docs/covid-19-symptom-survey-request-for-data-access/). The available data and survey waves are [documented here](https://cmu-delphi.github.io/delphi-epidata/symptom-survey/). Also, if you have specific research questions that are not addressed by the current survey questions, contact us. We cannot accommodate all requests, since the surveys must be kept short and face legal and ethical constraints, so we will try to prioritize important topics for public health.

## Who can I contact?

- Questions from survey respondents about consent, research ethics, or how their data is used: [delphi-admin-survey-fb@lists.andrew.cmu.edu](mailto:delphi-admin-survey-fb@lists.andrew.cmu.edu)
- Getting access to survey data for research: [complete this form](https://dataforgood.fb.com/docs/covid-19-symptom-survey-request-for-data-access/)
- Media inquiries:
  - [Byron Spice](mailto:bspice@cs.cmu.edu)  
    Director, Media Relations  
    School of Computer Science  
    Carnegie Mellon University
  - [Jason Maderer](mailto:maderer@cmu.edu)  
    Senior Director, Media Relations  
    Carnegie Mellon University
- All other questions:
   - [Alex Reinhart](mailto:areinhar@stat.cmu.edu)  
     Assistant Teaching Professor  
     Department of Statistics & Data Science  
     Carnegie Mellon University
