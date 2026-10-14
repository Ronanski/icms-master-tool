# v1.20.37 (Beta) - live values: hindi na patong sa isa't isa ang timer / valve / switch values at wire values

## Problem
Excel rule (5c): ang live values ay hindi dapat humaharang sa text, block, ibang live value o wire; side = level, itaas / baba = centered. Wala pang sukat; ang nakikita lang ay mga patong-patong na numero.

## As Found (v1.20.36, sinukat gamit ang bagong `tools/regress/values_layout.js`, 54 sheets, 2925 label, worst-case na 6-character na value)
Mga label na may patong: sa text 173, sa ibang value 277, sa block 243, sa wire 335. Alignment (side level / itaas-baba centered): 0 mali.

## Work Done
Ang mga value ng timer, valve, switch at AO ay inilalagay ng sarili nilang rule bago ang wire values; ngayon ang wire values ay umiiwas sa kanila (`vplace` sa `src/analog/ui/links-canvas.js`). Walang binago sa engine, sa lohika o sa mga numero.

## As Left (v1.20.37, parehong sukat)
- Patong sa ibang value: 277 -> **68**.
- Patong sa text: 173 -> 177, sa block: 243 -> 248, sa wire: 335 -> 400 (**lumala nang bahagya**: ang mga label na umiwas sa ibang value ay napunta sa wire).
- Kabuuan ng mga patong: 1028 -> 893 (-13%). **Hindi pa zero**: 51 ng 54 sheets ay may natitirang patong.
- Alignment: 0 mali (pareho).
- Sinubukan at hindi nakatulong: mas mabigat na penalty sa wire / block / text (walang pagbabago sa resulta), mas malayong gap hanggang 22 (halos wala), paglalagay ng timer / valve / switch value sa parehong exact na paraan ng wire values (mas marami ang patong sa block at wire, kaya binawi). Itinago ang timer / switch text kapag walang malinis na pwesto: sinubukan, binawi (nawawala ang impormasyon at hindi bumaba ang kabuuang patong).
- Dahilan ng natitira (halimbawa ABC-016, value ng AMT input 74): ang pin ay nasa maikling stub ng wire (3.7 unit) na nakadikit sa block, kaya walang malinis na pwesto sa paligid sa loob ng 22 unit.

## Status
Beta. Bahagyang ayos lang; HINDI pa tapos ang placement rule. Susunod na posibleng gawin (kailangan ng desisyon mo): (a) leader line (manipis na linya) para sa mga masisikip na lugar, o (b) ilipat ang value sa loob ng block / sa gilid ng sheet para sa mga stub na masyadong maikli. Hindi ko ito gagawin hangga't hindi mo pinipili.
