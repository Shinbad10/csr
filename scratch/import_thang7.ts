import { getPrisma } from "../src/lib/prisma";
import { genMaBN } from "../src/lib/maBN";

const RAW_DATA = `Trạm y tế xã Tân Hào (Tân Hào cũ - Giồng Trôm cũ)					
STT	Họ Tên	Năm Sinh	CĐ	BHYT	SĐT
1	NGUYỄN THỊ NGỌC EM	25/08/1952			
2	NGUYỄN THỊ BA	16/05/1947			
3	TRẦN THỊ ĐẸP	03/06/1949			
4	LÊ THỊ LẼ	29/06/1949	2MĐ 	100	0768842371
5	HỒ VĂN XE	12/07/1952	MTĐ	100	0906392207
6	NGUYỄN VĂN NHÁNH	10/10/1949	2MĐ 	100	
7	ĐOÀN THỊ VẸN	07/12/1972			
8	LÊ VĂN RÉP	24/03/1945			
9	PHẠM THỊ ĐẸP	12/05/1965	MPĐ	100	0945404533 con
10	TRỊNH THỊ LẠC	07/07/1970			
11	LÊ THỊ REN	07/08/1950	2MĐ	100	0353653703 tự đi
12	NGUYỄN THỊ NỚP	12/11/1951	2MĐ	100	
13	NGUYỄN THỊ BÌNH				
14	NGUYỄN VĂN TUẤN	19/02/1954	2MĐ	100	0378165471
15	NGUYỄN THỊ TIẾM	15/12/1949			
16	HUỲNH THỊ HỒNG	16/02/1958			
17	BÙI VĂN CỬNG	03/03/1953	2MĐ	100	0348152062
18	LÊ THỊ MAI	01/01/1947	2MĐ	100	0368348104
19	PHẠM VĂN MINH	27/07/1957			
20	DANH ĐÈO	20/12/1981			
21	TRẦN THỊ CHẮN	01/01/1963			
22	NGUYỄN THỊ CHANH	05/07/1947	2MĐ	100	0356046589
23	NGUYỄN NGỌC RE	10/10/1962	2MĐ	100	0917641933
24	LÊ VĂN ĐỠ	27/10/1963			
25	TRỊNH VĂN NHA	04/06/1964			
26	NGÔ THỊ THÚY	20/12/1961	2MĐ	100	0364309785
27	NGUYỄN VĂN LONG	05/11/1962	MPĐ	100	0358298095
28	NGUYỄN THỊ LẠT	01/08/1958	2MĐ	100?	0358279304 
29	NGUYỄN VĂN SẾT	24/04/1941			
30	ĐẶNG THỊ RỈ	15/07/1939			
31	NGUYỄN THỊ ĐẸP	16/01/1952	2MĐ	100	
32	NGUYỄN THỊ PHƯƠNG	13/05/1972			
33	TRẦN THỊ KIM QUYÊN	30/10/1980			
34	NGÔ THỊ QUYÊN	01/02/1943			
35	HUỲNH TẤN THANH	07/12/1980			
36	NGUYỄN THỊ TRÚC	28/08/1990			
37	ĐẶNG THỊ HOÀNG	28/08/1971	2MĐBS		
38	NGUYỄN THỊ HẠNH	01/01/1948	2MĐ	100	0366227834
39	BÙI HỮU TÀI	13/10/1986			
40	PHẠM THỊ LIÊN	1960	2MĐ	100	0384675729
41	TRẦN QUỐC TUẤN	01/01/1972			
42	NGUYỄN THỊ TƯỜNG	05/02/1962			
43	PHAN VĂN KHẢI	1965	2MĐ	100	0365225185
44	LÊ THỊ THANH THỦY	15/08/1972	2MĐ	KBH	
45	LÊ THỊ DIỆU	20/20/1975	2MĐ	100?	0372717423
46	NGUYỄN THỊ LỆ	15/08/1955			
47	HÀ THỊ LIÊN	06/01/1956	2MĐ	100	
48	LÊ THỊ LEM	15/08/1949	2MĐ	100	0372410100
49	NGUYỄN THỊ HIỀN	21/02/1990			
50	LÊ THỊ ÁNH	15/01/1944	2MĐ	100	
51	LÂM THỊ ĐẸP	1958	2MĐ	100?	
52	NGUYỄN THỊ XUÂN	07/05/1950			
53	NGUYỄN THỊ TRẮC	16/02/1962			
54	NGUYỄN VĂN BÉ NĂM	20/12/1968	2MĐ	100	
55	NGUYỄN HOÀNG DÂN	09/06/1967	2MĐ(BSK)	100?	0335429889
56	TRẦN THỊ KIM DUNG	18/08/1985			
57	NGUYỄN THỊ XUÂN	1945	MPĐ	100?	0868524638 
58	NGUYỄN VĂN ĐIỆP	01/03/1953	2MĐ	100	0379480576 
59	NGUYỄN VĂN DŨNG	02/03/1962	2MĐ	100	0327420965
60	NGUYỄN THỊ TUYẾT	15/07/1961	2MĐ	100	
61	ĐỖ THỊ THỦY	12/03/1958	2MĐ	100	0357409054
62	HUỲNH THỊ TUYẾT	15/07/1962	2MĐ	100	
63	PHẠM THỊ HỮU TÂM				
64	NGUYỄN VĂN HỒNG	07/03/1964	2MĐ	100	0352615674
65	PHẠM THỊ RO	1967	2MĐ	100	0792195088
66	CHÂU VĂN LƯ	15/02/1957	MPĐ	100	0398452464
67	NGUYỄN THỊ CHIẾN	18/04/1961	2MĐ	100	
68	PHẠM TRUNG HIẾU	14/06/1962	2MĐ	100	
69	NGUYỄN THỊ PHƯỢNG	07/03/1963	2MĐ	100	0834397205
70	NGUYỄN THỊ MỨC	05/05/1959	MTĐ	100	
71	LÊ THỊ PHẤN	08/04/1960	2MĐ	100	
72	NGUYỄN VĂN CHÂU	20/12/1955	2MĐ	100	
73	NGUYỄN THỊ LO	10/04/1954	2MĐ	100	
74	NGUYỄN VĂN CHÍNH	01/12/1956			
75	NGUYỄN THỊ TO	10/10/1957			
76	ĐOÀN THỊ CA	09/10/1949			
77	NGUYỄN THỊ THU	01/01/1973			
78	VÕ THỊ TUYẾT	29/12/1974			
79	NGUYỄN THỊ ĐỐ	07/08/1947	2MĐ	HH	
80	TRẦN KHẮC ƯU	15/10/1954	2MĐ	100	0365885315
81	NGUYỄN THỊ DỢT	30/10/1954	2MĐ	100	
82	NGUYỄN THỊ LIÊN	24/07/1950	2MĐ	100	
83	ĐẶNG THỊ BÉ	09/04/1945			
84	CHÂU THỊ CẦM	06/10/1958			
85	NGUYỄN THỊ BÉ TƯ				
86	NGUYỄN THỊ PHA	1967	2MĐ	100?	0375522183
87	TRẦN THỊ NHÀNH	01/04/1960	2MĐ	100	0382153883
88	TRẦN THỊ ĐẸP	1961	2MĐ	80	
89	NGUYỄN THỊ CẨM	01/03/1947	2MĐ	100	0394376949
90	NGUYỄN VĂN BÊN	21/12/1954		100	
91	PHAN THỊ HÀ	1956	2MĐBS		
92	ĐẶNG THỊ HÀ	10/08/1972	2MĐ	100	
93	NGUYỄN VĂN DỨT	12/02/1970	2MĐ	100	0339562685
94	TRẦN NGỌC NHÂN	05/06/1976			
95	NGUYỄN VĂN RÓT	15/07/1970	2MĐ, MTM	100	0334483115
96	NGUYỄN THỊ NHIỀU	20/10/1955	MPĐBS		
97	NGUYỄN THỊ HOÀNG	08/08/1948	MPĐ	100	
98	HUỲNH VĂN KHỞI	10/05/1955	2MĐBS		
99	NGUYỄN THỊ LIÊN	16/09/1967			
100	PHẠM VĂN HÙNG	07/07/1968			
101	NGUYỄN THỊ BÉ CHÍNH	08/03/1978			
102	HỒ THỊ NA	10/11/1968			
103	TRƯƠNG THỊ TRƯNG	18/06/1968			
104	NGUYỄN VĂN PHẤN	11/12/1965	MPĐ	100	0374438271
105	PHAN VÕ CHÂU NGHI	19/10/2010			
106	PHẠM VĂN HÙNG	03/03/1965	MTĐ	100	
107	NGUYỄN VĂN SANG	16/05/1950	MPĐ	100	
108	PHẠM VĂN RU	11/09/1963	2MĐ	KBH	
109	NGUYỄN THỊ HỒNG THU	07/08/1963	2MĐ	100	0383356471
110	LÊ THỊ ÁNH HỒNG				
111	PHAN THỊ THỦY	12/09/1962	2MĐ	KBH	
112	NGUYỄN THỊ HỒNG THẮM	08/01/1976	2MĐ	100	
113	NGUYỄN THỊ HIỀN	1953	2MĐ, 2MM	100	
114	LÊ THỊ RI	1949	2MĐ	100	0923982691
115	TRẦN THỊ LIÊM				
116	NGUYỄN THỊ THU	1960	2MĐ	100?	
117	NGUYỄN THỊ KIM LOAN	1954	2MĐ	100	0933018073
118	NGUYỄN THỊ BUÔN	1957	2MĐ	100?	
119	DƯƠNG MỘNG TRINH	1985			
120	HUỲNH VĂN HÙNG	1968			
121	NGUYỄN THỊ TIẾN				
122	NGUYỄN THỊ TÍM				
123	ĐẶNG THỊ ĐẦM	1947	MPĐ (BSK)	100?	
124	HUỲNH THỊ ÁNH HỒNG	1958	2MĐ	100	0348031061
125	NGUYỄN THỊ VÂN	1963	2MĐ	100	0987516455
126	TRỊNH THỊ PHỈ	1937			
127	TRẦN THỊ CHẲNG	1963			
128	NGUYỄN THỊ THAI	1964	MTĐ	100	0369504547
129	ĐOÀN THỊ VẸN	1972			
130	NGUYỄN THỊ ĐÈO	1964	2MĐ	100	0328676014
131	ĐẶNG VĂN THẢO	1954			
132	NGUYỄN THỊ TỚI	1951	2MĐ	100	
133	TRỊNH VĂN MAI	1964			
134	NGUYỄN THỊ GÁI	1969	2MĐ	100	0842668289
135	DƯƠNG THỊ PHƯỢNG	1964			
136	PHẠM THỊ ĐẸP				
137	NGUYỄN THỊ ĐẶNG	1953	2MĐ	100	0377433531
138	NGUYỄN THỊ LOAN	1972			
139	NGÔ THỊ BÌNH				
140	NGUYỄN THỊ NẾT	1951			
141	HỒ VĂN BẠNH	1958	MTĐ(BSK) (nhân nâu, zin yếu)	100	
142	LÊ THỊ TUYẾT				
143	NGUYỄN THỊ ÚT YÊN	1950	2MĐ	100	
144	LÂM THỊ KỊP	1966	MTĐ (BSK)	100	0326308449
145	NGUYỄN THỊ NGHIÊM	1946			
146	LÊ THỊ BI	1950	MPĐ	100	0343182637
147	NGUYỄN THỊ LIễU	1967	MTĐ	100	
148	TRẦN THỊ CHUÔNG				
149	TRẦN THỊ ÚT				
150	VÕ THỊ BỀN	1958	2MĐ	100	
151	PHAN THỊ TUYỀN	1959	2MĐ	100	
152	NGÔ THỊ LINH	1970			
153	LÊ THỊ HƯNG				
154	NGUYỄN THỊ CHẮN				
155	LÊ THỊ KHUÊ	1959	2MĐ	100	
156	NGUYỄN THỊ HIỆP	1956	2MĐ	100	0911092943
157	HỒ THỊ EM	1953	2MĐ	100	
158	NGUYỄN THỊ XEM	1962	2MĐ	100	0329153488
159	NGUYỄN THỊ ĐỎ	1958	2MĐ	100	0369232985
160	NGUYỄN THỊ HƯỜNG				
161	PHẠM THỊ ĐỰNG	1953	2MĐ	100?	0398584205
162	DƯƠNG VĂN LẤY	1956	2MĐ	100	
163	NGUYỄN VĂN SẾN				
164	NGUYỄN VĂN TRẮNG	1957	2MĐ	100	
165	NGUYỄN THỊ SEN				
166	TRẦN THỊ PHƯỢNG	1962	2MĐ	100	0355259105
167	ĐẶNG VĂN MINH				
168	ĐẶNG THỊ TIÊN	72T	MPĐ	100?	
169	PHAN VĂN TRINH	1958	2MĐ	100	0376948171
170	NGUYỄN THỊ MỸ	1967	2MĐ	100	0328987702
171	NGUYỄN THỊ TIẾC	1952	2MĐ	100?	0336995769 
172	NGUYỄN THỊ HỒNG ÁNH	1965	2MĐ	100?	
173	NGUYỄN THỊ EM	1959	2MĐ	100	0327013747
					
Trạm y tế xã Tân Hào (Tân Lợi Thạnh cũ - Giồng Trôm cũ)					
STT	Họ Tên	Năm Sinh	CĐ	BHYT	SĐT
1	Võ Thị Chậm	10/05/1967			
2	Phạm Thị Tư	04/06/1951			
3	Nguyễn Văn So	25/05/1951			
4	Lê Văn Luận	06/06/1956	2MĐ	100	
5	Trần Văn Thắm	21/10/1969	MPM	100	0329166114
6	Trần Thị Thanh Hà	1963			
7	Nguyễn Thị Sành	1944			
8	Lê Thị Yệu	12/08/1954	MTĐ	100	0384273919
9	Đặng Huy Tâm	20/12/1963			
10	Nguyễn Thị Bồng	12/10/1953	MTĐ	100	0329762745
11	Phạm Thị Tác	01/01/1960	2MM	100	
12	Từ Văn Minh	08/08/1967			
13	Nguyễn Thị Hoằn	25/07/1939	MPĐBS, MTĐ	100	
14	Trần Thị Ru	01/01/1972	2MĐ		
15	Nguyễn Thị Minh	21/01/1952	2MĐ	100	0348307363
16	Hồ Thị Mười	25/10/1969			
17	Trần Thị Điệp	10/12/1963			
18	Nguyễn Thị Ợt	20/09/1950	MPM	100	
19	Phạm Thị Cẩm	11/08/1956	2MĐ	100	
20	Nguyễn Thị Suông	16/01/1960			
21	Nguyễn Thị Nha	03/08/1961			
22	Nguyễn Văn Ném	07/06/1962	2MĐ	100	0974800083
23	Dương Thị Đậm	20/05/1960	2MĐ	100	
24	Nguyễn Văn Hùng	07/09/1963	2MĐ, 2MM (2MVKM)	100	0869716317
25	Trần Thị Bé Sáu	15/03/1961	2MĐ	100	
26	Trần Thị Chạy	02/09/1948	2MĐBS	100	
27	Trần Thị Tám	22/02/1968			
28	Võ Thái Hùng	06/03/1951	MTĐ(BSK)	100	0335870657
29	Nguyễn Thị Dậy	03/11/1966	2MĐBS		
30	Lê Thị Nà	20/04/1953	2MĐ	80	
31	Phan Văn Út	03/12/1957	2MĐ	95	0978728610
32	Lê Thị Đương	16/06/1956	2MĐ	100	0336338984 
33	Nguyễn Thị Kim Thoa	11/08/1962	2MĐ	100	0336338984
34	Võ Thị Ngon	15/07/1956	MPĐ	100	0971758253
35	Nguyễn Thị Anh	10/10/1946	2MĐ	100	
36	Nguyễn Văn So	1965	MPĐ	100	0378189958
37	Trần Thị Gôm	03/03/1960			
38	Trần Thị Đủ	01/05/1962			
39	Nguyễn Thị Trúc Quyên	21/07/1982	2MĐ	100	0347316138
40	Phạm Thị Loan	30/06/1957			
41	Nguyễn Thị Thảo	10/05/1942	2MĐ	100	0353564246
42	Nguyễn Thị Ron	08/05/1943			
43	Trương Thị Sương	10/10/1950			
44	Nguyễn Thị Nết	03/07/1946			
45	Lê Thị Chứa	03/07/1963			
46	Trần Thị Đanh	15/12/1951			
47	Trương Thị Hát	02/07/1970			
48	Nguyễn Thị Hòn	10/10/1974			
49	Trần Ninh Cương	03/05/1977			
50	Nguyễn Văn Đặt	12/07/1952	MPĐ	100	0356310222
51	Hồ Thị Băng	22/10/1944			
52	Nguyễn Văn Trường	01/01/1967	MPM	100	0979159304
53	Phạm Văn Huệ	15/06/1963	2MĐ	100	0333823638
54	Nguyễn Văn Trân	25/05/1954	MPĐ(BSK)	100	0985527486
55	Nguyễn Thị Hương	03/02/1956	2MĐ	100	
56	Hồ Thị Ngo	15/07/1951	2MĐ	100	
57	Nguyễn Thị Rồi	07/04/1977			
58	Nguyễn Văn Quyết	10/10/1967	MPĐ(BSK), MTM	100	0369228820
59	Nguyễn Thị Đèo	22/09/1963			
60	Võ Thị Be	03/03/1943	2MĐ	100	
61	Triệu Thị Tặng	10/05/1971/			
62	Võ Thị Mói	25/04/1943			
63	Nguyễn Thành Công	20/04/1949	MPĐBS	100	
64	Pha Thị Đẹp	20/10/1957			
65	Võ Thị Lẫm	03/09/1953	MTĐ	100	
66	Nguyễn Thị Gấm	1965	2MĐ	100	
67	Nguyễn Thị Bền	06/03/1953			
68	Nguyễn Thị Chưa	25/05/1964			
69	Nguyễn Thị Bé Tư	15/03/1966	2MĐ	100	
70	Trương Thị Thoa	10/12/1966			
71	Châu Thị Điệp	16/02/1960	MPĐ	100	
72	Nguyễn Văn Núi	11/07/1983			
73	Trần Văn Tê	14/04/1952	MPĐ, 2M Glo	100	
74	Trương Thị Thiệp	20/02/1954			
75	Nguyễn Văn Be	16/06/1956			
76	Trần Văn Thắng	03/09/1953	2MĐ	100	0374556442
77	Nguyễn Thị Ngưng	15/05/1959			
78	Đoàn Văn Trừ	12/12/1965			
79	Trần Thị Ri	05/06/1942			
80	Nguyễn Thị Đào	22/04/1940			
81	Đoàn Thị Cưng				
82	Nguyễn Thị Hòa	10/01/1969			
83	Trần Văn Nỉ	03/06/1947	2MĐ	100	0326394288
84	Trần Thị Duyên	12/10/1947			
85	Nguyễn Thị Điệp	04/04/1957	2MĐ, 2MM	100	0372887221
86	Nguyễn Văn Quận	07/07/1961			
87	Ngô Thị Hường	01/01/1963	2MĐ	100	0374551743
88	Trần Văn Đông Em	12/02/1973			
89	Nguyễn Thị Muộn	15/05/1950	MTĐ	100	
90	Huỳnh Thị Nguyệt	20/08/1949	2MĐ	100	
91	Huỳnh Văn Lắm Em	10/12/1971			
92	Cao Thị Kết	11/10/1967			
93	Phan Thị Út	01/01/1960	2MĐ	100	
94	Trần Văn Bé	01/01/1955	MPĐ	100	0978215303
95	Hồ Thị Ngọc Phương				
96	Phạm Thị Rót	1949	2MĐ	100	
97	Trương Văn Giáo	20/09/1956	2MĐ	100	
98	Nguyễn Thị Thu Hương	11/03/1969	2MĐ	100	0368424386
99	Trần Thị Lem	10/02/1958	MTĐ	100	0369847002
100	Bùi Thị Đức	15/06/1969			
101	Đặng Thị Vẻn	08/06/1971			
102	Nguyễn Thị Đẹp	09/08/1969	2MM (MTM kép)	100	0356883425
103	Nguyễn Thị Thủy	28/04/1965			
104	Nguyễn Thị Gái	07/12/1963	MTĐ, MTM	100	
105	Đoàn Văn Bé	03/06/1957			
106	Võ Thị Chúc	27/08/1956	2MĐ	100	
107	Đặng Thị E	06/04/1951	MTĐ, MTM, MPĐBS	100?	
108	Trần Thị Cúc	05/09/1958	MTM	100	0853517071
109	Trần Văn Cảnh	06/07/1969			
110	Nguyễn Thị Hồng Châu	1948	MTĐ	100	
111	Lê Thị Ngọc Phượng	1950	2MĐBS		
112	Lê Thị Liên	1969			
113	Hồ Thị Nhân	1947			
114	Nguyễn Thị Lệ	1960			
115	Võ Thị Kim Em	1966			
116	Nguyễn Thị Lai	1982			
117	Trần Văn Đây	1963	MTĐ	100	
118	Nguyễn Văn Phấn	1965			
119	Trần Văn Gỡ	1960	MPĐ (BSK)	100	0399049383
120	Trương Thị Phe	1959	MTĐ, MPĐBS	100	
121	Lê Thị Đèo	1961			
122	Lê Thị Bánh	1954	2MĐ	100	0359830409
123	Phan Thị Thấy	1953	2M Glo		
124	Trương Thị Kết	1965	2MĐ	100	0352490002
125	Trần Thị Thang	1957	2MĐ	100	
126	Nguyễn Thị Cục	1963			
127	Lê Văn Cay	1957	2MĐ (tai biến 4 tháng)	100	(ổn định mới mổ)
128	Trần Thị Thỏ	1952			
129	Trương Văn Dũng	1966			
130	Lê Thị Dạ	1953			
131	Đoàn Công Quán	1963	MTM	100	
132	Hồ Thị Nhị	1941			
133	Trẩn Thị Lá	1945	2MĐ(BSK)	95	
134	Nguyễn Thị Thúy	1979	MTM	100	
135	Đặng Thị A	1941			
136	Nguyễn Thị Lãnh	1947			
137	Đặng Văn Năm	1955			
138	Phan Thị Lẵm	1959	2MĐ	?	0399754478 
139	Nguyễn Văn Lai	1953	2MĐ	100	0333218905
140	Hồ Thị Liên				
141	Lê Thị Đậm	1952	MTĐ	100	
142	Huỳnh Văn Ôi	1956	MPĐ,MTM	100	0395871535
143	Lê Văn Hiền	1952			
144	Huỳnh Văn Tốt	1956			
145	Nguyễn Thị Ngấm	1952			
146	Lê Văn Hoàng	1971			
147	Lê Thị Bọ	1955	2MĐ	100	
148	Nguyễn Thị Dung	1975			
149	Trương Văn Nho	1975			
150	Lê Thị Thay	1948	2MĐ	100	
151	Nguyễn Thị Hợp	1967			
152	Trần Thị Khuyển	1958	2MĐ, MPM	100?	
153	Trần Thị Ánh	1953	2MĐ(BSK)	100	
154	Lê Thị Xuyên	1942	MTĐ	100	
155	Trần Văn Triêm	1962			
156	Nguyễn Thị Tư	1955	2MĐ	100	
157	Huỳnh Thị Đợt	1964	MPĐ	100	0362080359
158	Nguyễn Văn Minh	1970	2MM	100	
159	Nguyễn Thị Tím	1959			
160	Nguyễn Văn Lực	1966/60	2MM(MTM kép)	100	
161	Lê Văn Dội	1951			
162	Võ Văn Cường	1969	MTM	100	0332767661
163	Phạm Văn Mười	1979			
164	Lê Thị Mọt	1958	2MĐ	100	0343953055
165	Nguyễn Văn Thân	1951	MTĐ	100	
166	Nguyễn Thị Hoàng Nguyên	2010			
167	Huỳnh Thị Tiệp	1964	2MĐ	100	0326646719
168	Huỳnh Thị Ghé	1973			
169	Nguyễn Văn Vũ	1976	2MM, MTĐ	100	0397713168
170	Huỳnh Thị Bé Ba	1952	2MĐ	95	
171	Võ Văn Be	1964	MPĐ	100	0965429534
					
Trạm y tế xã Tân Hào (Thạnh Phú Đông cũ - Giồng Trôm cũ)					
STT	Họ Tên	Năm Sinh	CĐ	BHYT	SĐT
1	Huỳnh Văn Khinh	1938	2MĐ	100	0396412185 
2	Nguyễn Thị Hà	1962	2MĐ	100	0333739994
3	Đặng Văn Thảo	1954	2MĐBS		0363110828
4	Phạm Thị Liên	1961?	2MĐ	100	0333407177
5	Trần Thị Sua	1953	2MĐ	100	0397957306
6	Nguyễn Thị Ren	1968	MTĐ	100	
7	Đoàn Thị Thanh	1960	2MĐ	100	0354014346
8	Nguyễn Văn Lý	1948	2MĐ	100	0985185772
9	Võ Văn Dứt	1966	2MĐ	100	0907450766
10	Nguyễn Thị Anh	1951	MTM( BSK)	100?	
11	Nguyễn Thị Em	1957	2MĐ	100	0366561817
12	Hồ Thị Rụt	1952	MTĐ	100	
13	Huỳnh Thị Muôn	1948	2MĐ	100	0342665099
14	Phạm Thị Xuân	1955	2MĐ	100	
15	Nguyễn Thị E	1952	2MĐ	100	0397575708
16	Phan Thị Ngò	1963	2MĐ (BSK)	100	0976015361
17	Võ Thị Thanh Thủy	1958	2MĐ	100	0343691176
18	Trần Thị Thu	1965	MPĐ	100	0968149031
19	Nguyễn Thị Tuyết	1966	2MĐ	100	0919680500
20	Nguyễn Thị Hải	1943	2MĐ	100	0345221943
21	Nguyễn Văn Bi	1955	MTĐ (BSK)	100	0379882396
22	Nguyễn Thị Gần	1960	2MĐ	100	
23	Trương Thị Mối	1957	2MĐ	100	
24	Võ Văn Thuận	1951	MTĐ	100	0346065272
25	Lê Thị Giúp	1952	MTĐ(BSK)	100?	
26	Nguyễn Thị Thúy	1956	MPM	100?	
27	Nguyễn Văn Chiến	1964	2MĐ(BSK)	100	0356938935
28	Nguyễn Văn Cộp	1958	MTĐ	100	0919826491
29	Nguyễn Văn Đực	1963	MTĐ(BSK)	100	
30	Hồ Thị Sáu	1956	MPĐ	100	
31	Trần Văn Mơ	1957	2MĐ	100	
32	Trần Thị Năm	1952	2MĐ	100	
33	Trương Thị Điệp	1953	2MĐ	100	
34	Cao Văn Màu	1955	MPĐ, MTĐBS	100	0348047442 / 0366788765
35	Trần Văn Sơn	1958	2MĐ	100	0362471114
36	Nguyễn Thị Nhục	1963	MPĐ, MTĐBS	100	
37	Nguyễn Thị Vẽ	1957	2MĐ	100	
38	Nguyễn Tấn Đạt	1962	2MĐ	100	0762892237
39	Bùi Thị Khinh	1950	2MM, MTĐBS	100	
40	Hồ Văn Ruol	1959	MTM, MTĐ	100	
41	Nguyễn Thị Niềm	1951	2MĐ	100	
42	Đặng Thị Đầm	1956	2MĐ, 2MM	100	
43	Trương Thị To	1970	2MĐ	100	
44	Trần Văn Tằng	1962	MTĐ	100	0348058922
45	Nguyễn Thị Nhiền	1945	2MĐ	100	
46	Châu Thị Phượng	1976	MTM		
47	Lê Thị Mận	1948	MPĐ	100	0344716471
48	Lê Thị Bé	1956	2MĐ	100	0378256453
49	Huỳnh Thị Gọn	1947	2MĐ(BSK)	100	0336950254
50	Nguyễn Thị Về	1960	2MĐ	100	0325099359
51	Nguyễn Ngọc Re	1962	MTĐ	100	0917641933
52	Trần Thị Ỷ	1959	2MĐ	100	
53	Phan Thị Hoa	1963	2MĐ	80	
54	Nguyễn Văn Nô	1943	MPĐ	100	
55	Lê Thị Lượm	1967	2MĐ	100	
56	Phạm Thị Bé	1960	2MĐ	100	
57	Trần Thị Đoàn	1957	2MĐ	100	
58	Lê Thị Chọn	1950	2MĐ	100	
59	Nguyễn Thị Ấu	1951	2MĐ	100	
60	Nguyễn Thị Xiêm	1955	2MĐ	100	0865513934
61	Đặng Thị Phích	1963	2MĐ	100	0352808107
62	Trần Thị Sang	1949	MTĐ	100	0338915025
63	Trần Thị Rí	1955	MTĐ	100	0368496297
64	Nguyễn Thị Đẹp	1964	MTĐBS	100	
65	Lê Thị Bế Em	1965	MTĐ	100	0327716625
66	Phạm Thị Huệ	1959	2MĐ	100	0385432279
67	Nguyễn Văn Sửa	1956	MPĐ(BSK)	100	0355796008
68	Trần Thị Kiếm	1945	2MĐ	100	0362500402
69	Nguyễn Thị Phận	1954	MTĐ(BSK)	100	0354526244
70	Nguyễn Văn Tuôi	1945	2MĐ(BSK)	100	0916792283
71	Nguyễn Thị Thủy Em	1984	2MĐ, 2MM	80	0392370842
72	Trần Văn Măng	1963	2MĐ	100	
73	Phan Văn Tuấn	1958	2MĐ	100	0327682822
74	Trương Thị Rảnh	1950	MTĐBS	100	
75	Trần Thị Bé	1953	MTĐ	100	
76	Trần Thị Ngụ Em	1951	2MĐ	100	
77	Phạm Văn Chiến	1961	2MM	100	
78	Nguyễn Thị Tuyển	1970	2MĐ	100	0377815966
79	Trần Thị Riếp	1959	2MĐ	100	0358251139
80	Trần Ngọc Thảo	1956	2MĐ	100	0398251934
81	Trần Văn Kình	1949	2MĐ	100	
82	Phạm Thị Đẹp	1957	MPĐ	100	
83	Trần Thị Rết	1949	2MĐ(BSK)	100	
84	Nguyễn Thị Tuyến	1957	2MĐ	100	0338489709
85	Dương Thị Mãi	1951	2MĐ	100	0353990355
86	Nguyễn Thị Nga	1956	2MĐBS		
87	Nguyễn Văn Nhiều	1967	MTM	100	
88	Phạm Kim Ngưng	1970	2MĐ	100	0333812959
89	Võ Thành Hưởng	1947	2MĐ	100	
90	Nguyễn Thị Thu	1954	MTĐ	100	0395153954
					
Nhà văn hóa xã Hưng Mỹ (Hưng Mỹ cũ - Trà Vinh cũ)					
STT	Họ Tên	Năm Sinh	CĐ	BHYT	SĐT
1	NGUYỄN THỊ ÁNH	10/02/1952	MTĐ (ĐTĐ)	100	0367980815
2	DƯƠNG THỊ BÉ BA	01/01/1961			
3	TRẦN THỊ NGỌC THANH	16/05/1905			
4	NGUYỄN VĂN THƯƠNG	1956	MTĐ	100	0398807087
5	NGUYỄN VĂN VUÔNG	19/10/1952	2MĐ	100	0862278133
6	PHAN THỊ TƯ	1954	2MĐ	100	0862278133
7	TRẦN THỊ LAN	22/08/1961	MPĐ	100	0342416411
8	NGUYỄN THỊ NGỌC HỒNG	01/01/1951	2MĐ	100	
9	PHẠM VĂN RON	01/01/1953	2MĐ	100	0375213625
10	NGUYỄN THỊ NHÃ	01/01/1956	MTĐ(BS.Chánh)	100 TS	
11	ĐẶNG VĂN THUẬN	10/11/1963	2MĐ	100	0387549854
12	LÊ THỊ AI	01/01/1962	MPĐ(BSK)	100	
13	PHAN THỊ ĐỒNG	09/05/1948			
14	ĐẶNG THỊ CẨM HỒNG	10/11/1952			
15	TRẦN THỊ KHI	01/01/1962			
16	TRẦN THỊ LỆ	01/10/1966			
17	HUỲNH THỊ THU	01/01/1964	2MĐ	100	
18	NGUYỄN THỊ TIẾN	01/01/1951	2MĐ	100	
19	NGUYỄN VĂN THƠI	01/01/1952			
20	THÁI THỊ ĐẶNG	01/01/1944			
21	PHẠM THỊ SÈ	30/04/1960			
22	NGUYỄN THỊ NGỌC TRINH	27/07/1971			
23	TRẦN THỊ TRỔI	01/01/1957	MPĐ	100	0393020323 / 0978113732
24	ĐOÀN VĂN KHỐI	01/01/1960	MTĐ	100	0378272353
25	TỐNG THỊ THÙY TRANG	01/01/1974			
26	NGUYỄN VĂN TẶNG	01/01/1973			
27	LÂM VĂN HAI	01/01/1941	MTĐ (BSK) (Mắt độc nhất, nhân nâu)	100	
28	TRƯƠNG VĂN TÒNG	08/03/1943			
29	PHẠM THỊ LIễU	01/01/1951			
30	TRẦN THỊ NGỌC	01/01/1957	2MĐ	100	0382285477
31	NGUYỄN THỊ KIỂM	01/01/1954			
32	VÕ VĂN EM	01/01/1952	MTĐ	100	0797057892
33	VÕ THỊ HỒNG	30/04/1960			
34	LÊ THỊ TRÀNG	13/02/1952	2MĐ	100	0382716002
35	TRẦM THỊ CẨM	27/09/1960			
36	NGUYỄN VĂN MINH	08/07/1960	2MĐ	95	
37	TRẦN THỊ LÀ	01/01/1939			
38	HUỲNH THỊ BẾ	01/01/1941			
39	TRẦN VĂN MỌI	1958	MPĐ trắng (BSK)		
40	LÊ THỊ NGUYỆT	01/01/1962			
41	LÊ THỊ HƯƠNG	01/01/1966			
42	LÊ VĂN BÉ	01/01/1944	2MĐ	100	0395608342
43	NGUYỄN VĂN THỔ	01/01/1952	MPĐ	100	0333009896
44	NGUYỄN VĂN CHỨC	01/01/1954			
45	LÊ THỊ LANH	01/01/1953	2MĐ	100	
46	NGUYỄN VĂN KIẾN	01/01/1951	2MĐ	100	0356461882 chung chú Thổ
47	TĂNG THỊ NGỌC MỸ	01/01/1951	2MĐ (mộng độ 2)		
48	NGUYỄN THỊ THUYỀN	01/01/1957			
49	ĐOÀN VĂN ẨN	01/01/1965	MPĐ (hốc mắt sâu)	100	0353064872
50	NGUYỄN THANH VŨ	10/04/1970			
51	NGUYỄN THỊ BÉ EM	16/06/1972			
52	TRẦN THỊ ĐẸP	20/12/1962			
53	HỒ THỊ PHĨ	01/01/1952			
54	HÀ QUI LỢI	01/01/1953	2MĐ	100	0943597982
55	PHẠM THỊ TƯ	01/01/1965			
56	VÕ THỊ ĐẸP	01/01/1950	MPĐ	100	0328785414
57	HUỲNH THỊ HÂY	01/01/1948	MPĐ	100	0989828656
58	TRẦN THỊ BÌNH	01/01/1957			
59	ĐẶNG VĂN TỶ	16/09/1955			
60	TRẦN THỊ HÀ	13/09/1953	2MĐ	100	
61	NGUYỄN VĂN KHA	01/05/1953	2MĐ	100 BT	
62	NGUYỄN THỊ TRINH	01/01/1959			
63	ĐỖ THỊ LIễU	01/01/1961	2MĐ	100	0335760537
64	TRẦN THỊ ƠN	01/01/1951			
65	VÕ THỊ BẠCH MAI	01/01/1962	2MĐ	100	0385124019
66	TRẦN MINH LƯNG	01/01/1980	MPĐ (BS.Chánh) (cườm trẻ)	100 BT	
67	PHẠM THỊ BÉ	01/01/1949			
68	LÊ THỊ PHIÊN	01/01/1959	MPĐ	100	
69	LÊ VĂN TÀU	25/10/1971			
70	ĐẶNG THỊ DÙNG	01/01/1966			
71	TẠ VĂN HIẾU	01/01/1972			
72	NGUYỄN THỊ THIỆM	26/03/1975			
73	NGUYỄN THỊ ĐẤU	01/01/1973			
74	TÔ VĂN TIỀN	30/03/1963			
75	LÊ THỊ LAN	01/01/1969			
76	NGUYỄN THỊ THIẾT	16/08/1958			
77	LÊ VĂN ĐẰNG	20/10/1954			
78	TIÊU THỊ THÚY DANH	01/01/1956	2MĐ	100	
79	TỐNG THỊ THANH	01/01/1969			
80	LÊ VĂN NHỊN	01/01/1969			
81	TRƯƠNG THỊ LUYẾN	01/01/1961			
82	NGUYỄN THANH NHÀN	01/01/1951			
83	NGUYỄN THỊ NGỌC BẠCH	01/01/1957	MPĐ	100	
84	ĐOÀN THỊ NĂM	01/01/1957			
85	NGUYỄN THỊ HẠNH	01/01/1968			
86	NGUYỄN THỊ TRỌN	01/01/1965			
87	BÙI THỊ LÊ	01/01/1948			
88	PHẠM VĂN THỌ	01/01/1956			
89	NGUYỄN VĂN TÔN	01/01/1976			
90	HỒ VĂN NGHĨA	03/03/1965			
91	TÔ VĂN SỒI	01/01/1958	MTĐ	100	
92	TRẦN THỊ THỬA	01/01/1956			
93	HỒ VĂN KHẢI	01/01/1957	2MĐ	100	0339415070
94	THÁI THỊ ĐẺN	01/01/1963			
95	ĐINH VĂN KHINH	01/01/1957			
96	NGUYỄN THỊ MÃI	01/01/1959			
97	TRƯƠNG THỊ LẼ	01/01/1974			
98	TRẦN THỊ THUẬN	01/01/1972			
99	HUỲNH VĂN Ý	01/01/1960			
100	NGUYỄN THỊ THỦY	11/03/1953			
101	BÙI THỊ THANH	01/01/1949	MTĐ	100	
102	LÊ THỊ THƯƠNG	01/01/1952			
103	NGUYỄN VĂN XIÊM	01/01/1958	MPĐ(BSK)	100	0941626927
104	BÙI THỊ TUYẾT LAM	01/01/1967			
105	PHAN HỮU THẮNG	09/12/1961			
106	NGUYỄN THỊ HƯỜNG	01/01/1952	MTĐ	100	0862295145 chung chú Vui
107	TRƯƠNG VĂN VUI	01/01/1951	2MĐ	100	0862295145 chung cô Hường
108	LÊ NGỌC NHIỄM	26/07/1964			
109	TRẦN THỊ KIỂU	01/01/1960			
110	HỒ THẾ LỢI	13/04/1976			
111	PHAN THỊ CHIỀU	19/11/1964			
112	HỒ VĂN KHỜI	05/05/1964			
113	NGUYỄN VĂN CHI	01/01/1962	MPĐ	100	0387538479
114	ĐINH VĂN VIỆT	01/01/1951	2MĐ		
115	HỒ THỊ HUẨN	01/01/1967			
116	NGUYỄN THỊ TUI	01/01/1962			
117	NGUYỄN VĂN CHỜ	01/01/1955	2MĐ		
118	PHẠM VĂN ĐẮC	01/01/1975			
119	LÊ THỊ THU	01/01/1968			
120	TÔ THỊ HOA	01/01/1950	2MĐ	100	0984263569
121	NGUYỄN THỊ CẨM	28/05/1964			
122	LÂM THỊ MỸ HẰNG	06/11/1958			
123	TRẦN VĂN TỔNG	19/09/1956			
124	PHAN THỊ BÉ MUỘI	19/10/1973			
125	PHAN THỊ LỆ THỦY	18/04/1982			
					
Nhà văn hóa xã Hưng Mỹ (Phước Hảo cũ - Trà Vinh cũ)					
STT	Họ Tên	Năm Sinh	CĐ	BHYT	SĐT
1	Nguyễn Thị Phương Dung	01/01/1969	2MĐ+Glo	80	
2	Lê Thị Dung	01/01/1955	2MĐ	80	0358039385
3	Nguyễn Thị Hồng	01/01/1951	MTĐ	100	
4	Trần Thị Sen	01/01/1955	2MĐ	100	
5	Trần Văn Thích	20/8/1951	2MĐ	100	0332618456
6	Kim Tiếng	9/10/1946			
7	Kim Phải	01/01/1944	2MĐ	100	0987003328
8	Lê Hữu Dậy	30/12/1957	2MĐ	95	
9	Nguyễn Văn Sắc	01/01/1954	2MĐ	100	0972509116
10	Nguyễn Văn Sụ	01/01/1962	2MĐ	100	
11	Lâm Thị Chơn	01/01/1950	MPĐ	100	0976162645
12	Trương Thị Bé Năm	01/01/1962	2MĐ	100	
13	Mai Thị Tuyết	01/01/1956	2MĐ	100	
14	Ngô Thị Đang	01/01/1952			
15	Thạch Thị Sa Mét	01/01/1959			
16	Thạch Thị Sane	01/01/1975			
17	Thạch Sisourarith	01/01/1953	2MĐ	100	0387275462
18	Thạch Thị Phi Nhi	01/01/1970	2MĐ (đường cao)	100	0967067937
19	Thạch Thị Nhàn	01/01/1970			0352486791
20	Nguyễn Văn Nuôi	01/01/1956	2MĐ	100	0344464777
21	Đào Thị Thu Hương	01/01/1972			0378053673
22	Thạch Thị Vay	01/01/1951			
23	Huỳnh Thị Đạt	01/01/1951			
24	Nguyễn Thị Xinh	01/01/1959	2MĐ	100	0396344696
25	Ngô Thị Thôi	01/01/1950	2MĐ	100	0782965110
26	Thạch Thị Liên	01/01/1955	2MĐ	100	
27	Thạch Thị Mari	01/01/1953	2MĐ	100	
28	Sơn Hồng Giác	01/01/1959	2MĐ	100	0399552311
29	Thạch Thị Rương	01/01/1960	MTĐ (BSK) (Mắt độc nhất)	100	
30	Võ Văn Phấn	01/01/1955	MPĐ	100	
31	Huỳnh Hữu Trang	01/01/1969			0342534282
32	Thạch Thị Cương	01/01/1954	2MĐ	100	
33	Trương Thị Đợi	01/10/1960			
34	Trương Thị Phượng	12/9/1966			0911945454
35	Trần Thị Thao	01/01/1951	2MĐ	100	
36	Nguyễn Văn Bảnh	01/01/1951	2MĐ	100	
37	Thạch Thị Chót	01/01/1959	2MĐ	100	0352486791
38	Thạch Thị Tư	01/01/1951	2MĐ	100	
39	Lâm Thị Điệp	01/01/1948	2MĐ	100	0378053673
40	Nguyễn Thị Cúc	01/01/1943	2MĐ	100	0976005874
41	Thạch Thị Quyền	01/01/1956	2MĐ	100	
42	Thạch Tấn	01/01/1970			
43	Thạch Minh	01/01/1950	MPĐ (sẹo GM)	100	
44	Thạch Thị Rạch	01/01/1946	2MĐ	100	0366616265
45	Thạch Phịch	01/01/1959	2MĐ	100	
46	Sơn Sa Quene	01/01/1968	MPĐ	100	0368331178
47	Thạch Thị Sa Rươne	01/01/1964	2MĐ	100 BT	
48	Lê Thị Hồng Kiều	01/01/1970			0384956071
49	Phạm Văn Hạt	12/5/1967			0338795173
50	Nguyễn Văn Trạng	01/01/1950			0365066131
51	Lâm Bảo Phần	10/12/1971	2MĐ	100	0979197026
52	Lâm Thị Vọng	1963	2MĐ	100?	0388910559
53	Hồ Thị Đẹp	01/01/1957	2MĐ (2MVKM)	100	0355451434
54	Lâm Thị Dúng	01/01/1955	2MĐ	100	0366162213
55	Sơn Thương				
56	Thạch Thị Nga	1951	2MĐ	100	
57	Ngô Thị Thu Thủy	1962	2MĐ	100?	
58	Thạch Thị Sông	1946	2MĐ	100	
59	Thạch Thị Trận	1959	2MĐ	100	
60	Thạch Thị SaRine	1960	2MĐ	100	
61	Thạch Hiền	1978	MT Mộng	100	0345061654
62	Huỳnh Anh Tuấn	1980			
63	Trần Hữu Phước	1947	MTĐ	100	
					
Nhà văn hóa xã Hưng Mỹ (Hòa Lỡ cũ - Trà Vinh cũ)					
STT	Họ Tên	Năm Sinh	CĐ	BHYT	SĐT
1	Thạc Thị Sol	01/01/1956	2MĐ	100	
2	Sơn Thị Thanh	01/01/1953	2MĐ	100	0379710219
3	Nguyễn Văn Nam	01/01/1942			0383817039
4	Thạch Thị Chiệt	01/01/1961	MPM	100	
5	Thạch Thị Hoang	01/01/1957			0945457818
6	Thái Thị Hồng	01/01/1942	2MĐBS		0332751019
7	Phạm Văn Út	01/01/1967			0362699385
8	Lê Văn Thu	01/01/1950	MPĐ	100	0949722109
9	Nguyễn Văn Phường	01/01/1964			0788942403
10	Trần Bằng	01/01/1953	2MĐ, MTM	100	
11	Trần Thị Tuyết	01/01/1970	2MĐ	100	0365762147
12	Thạch Chiệt	01/01/1964			0344454529
13	Phạm Văn Nghề	01/01/1952	2MĐ	100	0396713829
14	Huỳnh Thị Phiên	01/01/1963			
15	Trần Văn Lộc	01/01/1971			0399455442
16	Đỗ Văn Thạnh	01/01/1965	2MĐ	100	0359166925
17	Trần Thị Phẩm	01/01/1950	2MĐ	100	
18	Đoàn Thị Thương	01/01/1960	MTM Kép, MPM	100	0358671695
19	Thạch Thị Sa Khum	01/01/1958	2MĐ (BSK)	100	
20	Lư Trọng	01/01/1955	2MĐ	100	
21	Nguyễn Văn Hậu	05/10/1943	MPĐ	100	0947085819 Chung cô Mãnh
22	Trần Thị Mỹ	02/06/1952			0394614929
23	Quách Xuân Nữ	15/06/1958	2MĐ	95 HT	0975317630
24	Kim Thị Chính	01/01/1969			0964345433
25	Lê Thị Mảnh	10/01/1959	2MĐ	100	0336005120
26	Thạch Cham	01/01/1948	2MĐ	100	
27	Thạch Đi La	30/07/1964			0333556955
28	Trần Huệ	03/04/1953	2MĐ, MPM	100	0767934515
29	Tô Chánh Thi	20/04/1969	2MĐ	100	0347285590
30	Hứa Kiên Hoàng	01/01/1965	MPĐ(BSK)	100	
31	Thạch Thị Hòa	01/01/1952	2MĐ, MPM kép (VKM)	100	
32	Võ Thị Ngon	1946	MPĐ	100	
33	Thạch Thị Mai Sao	01/01/1972			
34	Cao Văn Quân	01/01/1964	2MĐ, MTM	100	
35	Triệu Thị Hiệp	01/01/1962	2MĐ	100	0336576047
36	Đỗ Thị Vân	01/01/1959	2MĐ	100	
37	Sơn Thị Phonl	01/01/1966	2MĐ	100	
38	Đỗ Thị Quang	01/01/1957	2MĐ	100	0333890700
39	Thạch Thị Si	01/01/1957	2MĐ	100	
40	Thạch Sự	01/01/1965	MTM kép	100	
41	Trần Văn Thắng	24/04/1954	2MĐ	100	
42	Thạch Thị Danh	11/07/1953	MTĐ	100	
43	Lâm Thị Mỹ Dung	01/01/1976			0772930945
44	Nguyễn Thành Diệp	19/08/1974			0772829700
45	Tạ Thị Thủy	01/01/1963			0325376329
46	Sơn Thị Diệu	15/12/1964	2MĐ, MTM	100	
47	Nguyễn Thị Kim Huệ	30/04/1973			0368916290
48	Câu Ras Mey	01/10/1954	2MĐ (MP chấn thương cũ, BS Kiền)		0844178918
49	Trần Thị Bính	01/01/1949			
50	Thạch Thị Sa Minh	01/01/1958	2MĐ	100	0937519813
51	Vỏ Thị Tem	01/01/1962			0862195497
52	Nguyễn Thành Ninh	24/07/1978			0907895111
53	Thạch Thị Ánh	01/01/1963	2MĐ (Đục trắng cứng, BS Kiền)	HH	0325725677
54	Thạch Thị Na Ly	1950			
55	Nguyễn Văn Thuận	10/10/1948	2MĐ	100	0963344780
56	Nguyễn Thị Phương	02/08/1956	2MĐ, 2MM	100	0964290554
57	Bùi Thị Hương	01/01/1974	2MM, MTM kép	100	0977574194
58	Nguyễn Thị Bông	01/01/1950	2MĐ	100	
59	Kiên Thị Trang	12/03/1966			
60	Tô Kim Ruônl	01/01/1960			
61	Bành Thị Mỹ Lệ	01/01/1973	MTĐ	100	
62	Lê Thị Bông	01/01/1970			0353805211
63	Thái Thị Kỷ	01/01/1946	MTĐBS		0353805211
64	Thạch Thị Thê	01/01/1948	2MĐ	100	
65	Kim Thị Hoa	1964	MTĐ(BSK)	100?	
66	Đinh Thị Lưỡng	01/01/1039	2MĐ	100	
67	Thạch Thị Viên	01/01/1955	2MĐ	100	
68	Đặng Thị Phượng	12/08/1966			0948894053
69	Thạch Thị Cương	01/01/1962	2MĐ	100	0369949346
70	Bành Thị Dung	15/08/1957	2MĐ	100	
71	Sơn Danh	25/04/1958	MPĐ(BSK)	100	0914664409
72	Kim Cợt	01/01/1959			
73	Thạch Thị Prịch	01/04/1950	2MĐ	100	
74	Kim Thị Hạnh	01/01/1969			
75	Kiên Thị Ngọc Lan	09/07/1969			
76	Trần Văn Lộc	01/01/1961			0399297311
77	Thạch Không	01/01/1958			
78	Nguyễn Hồng Phước	01/01/1981		100	0393020319
79	Thạch Sôm Rách	13/02/1981			0374214153
80	Mai Văn Chính	01/01/1966	2MĐ	100	0931074776
81	Huỳnh Quang Trung	01/01/1967			
82	Nguyễn Thị Mộng	01/01/1962			
83	Kim Thanh Hồng	1958			0346780254
84	Sơn Thị Sy Gia	01/01/0196			
85	Thạch Thị Phụ	01/01/1972			
86	Thạch Thị Sen	01/01/1956			
87	Thạch Thị Hường	01/01/1968	2MĐ	100	
88	Trần Thị Liên	01/01/1962			
89	Thái Thị Thúy	01/01/1958	2MĐ	100	
90	Sơn Thị Rương	01/01/1972			
91	Thạch Na Rinh	01/01/1966			
92	Phan Văn Tám	01/01/1966	2MĐ	100	
93	Lê Thị Ngọc Sương	01/01/1971			
94	Thạch Thị Diệu Phước	1964	2MĐ	100?	
95	Trần Thị Ớt	1953	2MĐ		`;

interface SectionData {
  title: string;
  xa: string;
  ngayKham: string;
  rows: Array<{
    stt: number;
    hoTen: string;
    namSinhRaw: string;
    cdRaw: string;
    bhytRaw: string;
    sdtRaw: string;
  }>;
}

function parseSections(raw: string): SectionData[] {
  const lines = raw.split(/\r?\n/).map(l => l.trimEnd());
  const sections: SectionData[] = [];
  let currentSection: SectionData | null = null;
  let dayCounter = 10; // Tháng 7: bắt đầu từ ngày 10/07/2026 cho 6 đoàn

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    if (line.startsWith("STT\t") || line.startsWith("STT ")) continue;

    // Nếu dòng không bắt đầu bằng số (STT), đây là header đoàn khám mới
    if (!/^\d+[\t ]/.test(line)) {
      let xaName = "Tân Hào";
      if (line.toLowerCase().includes("hưng mỹ")) xaName = "Hưng Mỹ";
      else if (line.toLowerCase().includes("tân hào")) xaName = "Tân Hào";

      currentSection = {
        title: line,
        xa: xaName,
        ngayKham: `2026-07-${dayCounter++}T01:30:00.000Z`,
        rows: []
      };
      sections.push(currentSection);
      continue;
    }

    if (currentSection) {
      const parts = lines[i].split("\t");
      const stt = parseInt(parts[0].trim()) || currentSection.rows.length + 1;
      const hoTen = (parts[1] || "").trim();
      const namSinhRaw = (parts[2] || "").trim();
      const cdRaw = (parts[3] || "").trim();
      const bhytRaw = (parts[4] || "").trim();
      const sdtRaw = (parts[5] || "").trim();

      if (hoTen) {
        currentSection.rows.push({
          stt,
          hoTen,
          namSinhRaw,
          cdRaw,
          bhytRaw,
          sdtRaw
        });
      }
    }
  }
  return sections;
}

function parseGender(hoTen: string): string {
  const t = hoTen.toUpperCase();
  if (/\b(THỊ|NỮ|EM|BÉ|MAI|LAN|HỒNG|TUYẾT|DUNG|PHƯỢNG|QUYÊN|LOAN|TRÚC|HUỆ|THỦY|YẾN|NGA|TRINH|LIÊN|VẸN|ĐẸP|BÌNH|CHẮN|THÚY|LẠT|XUÂN|TUYẾT|MỸ)\b/.test(t)) {
    return "Nữ";
  }
  if (/\b(VĂN|HỮU|TẤN|QUỐC|HOÀNG|MINH|LONG|TUẤN|KHẢI|DŨNG|HỒNG|HIẾU|CHÂU|CHÍNH|TÀI|PHẤN|SANG|RU|LẤY|TRẮNG|MINH|TRINH)\b/.test(t)) {
    return "Nam";
  }
  return "Nữ"; // mặc định Nữ nếu không rõ
}

function parseBirth(raw: string): { namSinh: number; ngaySinh: Date | null } {
  const clean = raw.trim();
  if (!clean) return { namSinh: 1960, ngaySinh: null };
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(clean)) {
    const [d, m, y] = clean.split("/").map(Number);
    return { namSinh: y, ngaySinh: new Date(Date.UTC(y, m - 1, d)) };
  }
  if (/^\d{1,2}\/\d{1,2}\/\d{4}/.test(clean)) {
    const parts = clean.split("/").map(Number);
    return { namSinh: parts[2], ngaySinh: new Date(Date.UTC(parts[2], parts[1] - 1, parts[0])) };
  }
  if (/^\d{2}\/\d{4}$/.test(clean)) {
    const [m, y] = clean.split("/").map(Number);
    return { namSinh: y, ngaySinh: null };
  }
  if (/^\d{4}$/.test(clean)) {
    return { namSinh: parseInt(clean), ngaySinh: null };
  }
  if (/^\d+T/i.test(clean)) {
    const age = parseInt(clean);
    return { namSinh: 2026 - age, ngaySinh: null };
  }
  const matchY = clean.match(/\b(19\d{2}|20\d{2})\b/);
  if (matchY) {
    return { namSinh: parseInt(matchY[0]), ngaySinh: null };
  }
  return { namSinh: 1960, ngaySinh: null };
}

function parseDiagnosis(cdRaw: string): {
  chanDoan: string[];
  chanDoanKhac: string | null;
  khuyenNghi: string | null;
  huongXuTri: string | null;
  benhSu: boolean;
  loaiBenhSu: string;
  benhLy: string;
  hasDiag: boolean;
} {
  const clean = cdRaw.trim();
  if (!clean || clean === "-" || clean === "0" || clean.toLowerCase() === "không") {
    return {
      chanDoan: [],
      chanDoanKhac: "Ổn không có bệnh về 2 mắt",
      khuyenNghi: "Theo dõi",
      huongXuTri: "Theo dõi",
      benhSu: false,
      loaiBenhSu: "[]",
      benhLy: "Chưa phát hiện bất thường",
      hasDiag: false
    };
  }

  const list: string[] = [];
  const upper = clean.toUpperCase();

  if (upper.includes("MĐ") || upper.includes("MTĐ") || upper.includes("MPĐ") || upper.includes("ĐỤC") || upper.includes("CƯỜM") || upper.includes("TTT")) {
    list.push("Đục thủy tinh thể");
  }
  if (upper.includes("MM") || upper.includes("MPM") || upper.includes("MTM") || upper.includes("MỘNG")) {
    list.push("Mộng");
  }
  if (upper.includes("BS") || upper.includes("BAO SAU")) {
    list.push("Đục bao sau");
  }
  if (upper.includes("GLO") || upper.includes("TAI BIẾN") || upper.includes("CHẤN THƯƠNG") || upper.includes("ĐTĐ") || upper.includes("SẸO") || upper.includes("HỐC MẮT") || upper.includes("VKM")) {
    if (!list.includes("Khác")) list.push("Khác");
  }

  // Phân tích mắt chỉ định từ chữ viết tắt trong CĐ
  let eyeStr = "";
  if (upper.includes("2M") || upper.includes("HAI MẮT") || (upper.includes("MT") && upper.includes("MP"))) {
    eyeStr = "2 mắt";
  } else if (upper.includes("MT") || upper.includes("MẮT TRÁI")) {
    eyeStr = "Mắt trái";
  } else if (upper.includes("MP") || upper.includes("MẮT PHẢI")) {
    eyeStr = "Mắt phải";
  }

  // Tinh chỉnh chanDoanKhac để hiển thị rõ cả viết tắt CĐ lẫn chỉ định mắt
  let diagDetail = clean;
  if (eyeStr && !clean.toLowerCase().includes(eyeStr.toLowerCase())) {
    diagDetail = `${clean} (${eyeStr})`;
  }

  return {
    chanDoan: list,
    chanDoanKhac: diagDetail,
    khuyenNghi: "Phẫu thuật",
    huongXuTri: "Phẫu thuật",
    benhSu: true,
    loaiBenhSu: JSON.stringify(list),
    benhLy: "Nghi ngờ bệnh lý",
    hasDiag: true
  };
}

function parseBhyt(bhytRaw: string): { bhyt: string; mucHuongBHYT: number | null } {
  const clean = bhytRaw.trim().toUpperCase();
  if (!clean) return { bhyt: "Không rõ", mucHuongBHYT: null };
  if (clean.includes("100")) return { bhyt: "100%", mucHuongBHYT: 100 };
  if (clean.includes("95")) return { bhyt: "95%", mucHuongBHYT: 95 };
  if (clean.includes("80")) return { bhyt: "80%", mucHuongBHYT: 80 };
  if (clean.includes("KBH") || clean.includes("KHÔNG") || clean.includes("HH")) return { bhyt: "Không có", mucHuongBHYT: 0 };
  return { bhyt: "Không rõ", mucHuongBHYT: null };
}

function parsePhone(sdtRaw: string): { sdt: string | null; sdtNguoiNha: string | null } {
  const clean = sdtRaw.trim();
  if (!clean) return { sdt: null, sdtNguoiNha: null };
  const phoneMatch = clean.match(/0\d{9}/);
  if (phoneMatch) {
    const p = phoneMatch[0];
    const extra = clean.replace(p, "").trim().replace(/^[\/,-]+/, "").trim();
    return { sdt: p, sdtNguoiNha: extra || null };
  }
  return { sdt: null, sdtNguoiNha: clean };
}

async function main() {
  const prisma = getPrisma();
  const sections = parseSections(RAW_DATA);
  console.log(`Tìm thấy ${sections.length} đoàn khám trong dữ liệu Tháng 7.`);

  // Dọn dẹp các buổi khám cũ bị tạo dở dang hoặc chạy thử trước đó theo tiêu đề đoàn khám
  const titles = sections.map(s => s.title);
  const deleted = await prisma.buoiKham.deleteMany({
    where: {
      OR: [
        { ghiChu: { in: titles } },
        { ghiChu: { contains: "Phước Hảo cũ" } },
        { ghiChu: { contains: "Hòa Lỡ cũ" } },
        { ghiChu: { contains: "Hưng Mỹ cũ" } },
        { ghiChu: { contains: "Tân Hào cũ" } },
        { ghiChu: { contains: "Tân Lợi Thạnh cũ" } },
        { ghiChu: { contains: "Thạnh Phú Đông cũ" } }
      ]
    }
  });
  if (deleted.count > 0) {
    console.log(`Đã dọn dẹp ${deleted.count} buổi khám cũ trước khi import mới.`);
  }

  let totalImported = 0;
  let countNhomA = 0;
  let countNhomB = 0;
  let countOn = 0;

  for (const sec of sections) {
    console.log(`\n── Đang xử lý đoàn: ${sec.title} (${sec.rows.length} bệnh nhân)...`);
    const dateStr = new Date(sec.ngayKham).toISOString().slice(2, 10).replace(/-/g, ""); // YYMMDD
    const count = await prisma.buoiKham.count({
      where: { id: { startsWith: `ĐK-${dateStr}` } },
    });
    const id = `ĐK-${dateStr}-${String(count + 1).padStart(2, "0")}`;

    const buoiKham = await prisma.buoiKham.create({
      data: {
        id,
        coSoId: "BT",
        ngayKham: new Date(sec.ngayKham),
        xa: sec.xa,
        diaDiem: sec.title.split("(")[0].trim(),
        ghiChu: sec.title,
        nguoiTao: "CSKH.BT",
        syncStatus: "SYNCED"
      }
    });

    for (const row of sec.rows) {
      const { namSinh, ngaySinh } = parseBirth(row.namSinhRaw);
      const gioiTinh = parseGender(row.hoTen);
      const diag = parseDiagnosis(row.cdRaw);
      const { bhyt, mucHuongBHYT } = parseBhyt(row.bhytRaw);
      const { sdt, sdtNguoiNha } = parsePhone(row.sdtRaw);

      const maBN = genMaBN("BT", new Date(sec.ngayKham), row.stt);

      // Kiểm tra xem maBN đã tồn tại chưa (nếu trùng stt thì cộng thêm 1000)
      let finalMaBN = maBN;
      const exist = await prisma.hoSoBenhNhan.findUnique({ where: { maBN: finalMaBN } });
      if (exist) {
        finalMaBN = genMaBN("BT", new Date(sec.ngayKham), row.stt + 1000);
      }

      const hasPhone = Boolean((sdt && sdt.trim()) || (sdtNguoiNha && sdtNguoiNha.trim()));

      let nhom: string | null = null;
      let trangThai = "DaKham";
      let followUpStatus: string | null = null;
      let xacNhanDieuTri: boolean | null = null;
      let lyDoKhongDieuTri: string | null = null;
      let ngayDieuTri: Date | null = null;

      if (diag.hasDiag) {
        // Bệnh nhân có Chẩn đoán -> Thuộc bên có chỉ định phẫu thuật
        if (hasPhone) {
          // Có luôn số điện thoại -> Trạng thái Đồng ý mổ (Nhóm A)
          nhom = "A";
          trangThai = "NhomA";
          xacNhanDieuTri = true;
          lyDoKhongDieuTri = null;
          followUpStatus = "Đồng ý mổ";
          // Lịch mổ dự kiến là ngày hôm sau của đợt khám
          const d = new Date(sec.ngayKham);
          d.setDate(d.getDate() + 1);
          ngayDieuTri = d;
          countNhomA++;
        } else {
          // Có chỉ định nhưng không có SĐT -> Suy nghĩ thêm (Nhóm B)
          nhom = "B";
          trangThai = "NhomB";
          xacNhanDieuTri = false;
          lyDoKhongDieuTri = "Suy nghĩ thêm (chưa có SĐT)";
          followUpStatus = "Suy nghĩ thêm";
          ngayDieuTri = null;
          countNhomB++;
        }
      } else {
        // Không có chẩn đoán -> Ổn không có bệnh về 2 mắt
        nhom = null;
        trangThai = "DaKham";
        xacNhanDieuTri = false;
        lyDoKhongDieuTri = "Ổn không có bệnh về 2 mắt";
        followUpStatus = "Ổn không có bệnh về 2 mắt";
        ngayDieuTri = null;
        countOn++;
      }

      await prisma.hoSoBenhNhan.create({
        data: {
          maBN: finalMaBN,
          stt: row.stt,
          buoiKhamId: buoiKham.id,
          coSoId: "BT",
          hoTen: row.hoTen,
          gioiTinh,
          ngaySinh,
          namSinh,
          sdt,
          sdtNguoiNha,
          bhyt,
          mucHuongBHYT,
          chanDoan: JSON.stringify(diag.chanDoan),
          chanDoanKhac: diag.chanDoanKhac,
          khuyenNghi: diag.khuyenNghi,
          huongXuTri: diag.huongXuTri,
          benhSu: diag.benhSu,
          loaiBenhSu: diag.loaiBenhSu,
          benhLy: diag.benhLy,
          nhom,
          trangThai,
          followUpStatus,
          xacNhanDieuTri,
          lyDoKhongDieuTri,
          ngayDieuTri,
          createdBy: "CSKH.BT",
          syncStatus: "SYNCED"
        }
      });
      totalImported++;
    }
  }

  console.log(`\n🎉 HOÀN TẤT IMPORT! Tổng cộng: ${totalImported} hồ sơ.`);
  console.log(` ├── Nhóm A (Có chỉ định mổ + Có SĐT - Đồng ý mổ): ${countNhomA} bệnh nhân`);
  console.log(` ├── Nhóm B (Có chỉ định mổ + Không SĐT - Suy nghĩ thêm): ${countNhomB} bệnh nhân`);
  console.log(` └── Ổn không có bệnh về 2 mắt (Không CĐ): ${countOn} bệnh nhân\n`);
}

main().catch(console.error).finally(() => process.exit(0));
