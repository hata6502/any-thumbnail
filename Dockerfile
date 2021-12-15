FROM amazon/aws-lambda-nodejs:14

RUN yum install -y gzip tar wget

RUN wget https://download.documentfoundation.org/libreoffice/stable/7.1.7/rpm/x86_64/LibreOffice_7.1.7_Linux_x86-64_rpm.tar.gz && \
  tar -zxvf LibreOffice_7.1.7_Linux_x86-64_rpm.tar.gz && \
  yum install -y LibreOffice_7.1.7.2_Linux_x86-64_rpm/RPMS/*.rpm && \
  rm -rf LibreOffice_7.1.7.2_Linux_x86-64_rpm LibreOffice_7.1.7_Linux_x86-64_rpm.tar.gz

RUN yum install -y ImageMagick
RUN yum install -y cairo cups-libs libSM poppler-utils
RUN yum install -y ipa-gothic-fonts ipa-mincho-fonts
RUN yum clean all

COPY package.json package-lock.json /var/task/
RUN npm ci
COPY index.js /var/task/

CMD ["index.lambdaHandler"]
