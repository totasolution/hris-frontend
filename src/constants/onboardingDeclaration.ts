import type { DeclarationChecklistData } from '../services/api';

/** Default declaration checklist (all unchecked). Used for new onboarding and as template for display. */
export function getDefaultDeclarationChecklist(): DeclarationChecklistData {
  return {
    ketentuan: [
      {
        id: 'k1',
        text: 'Bersedia melengkapi Dokumen Persyaratan Administrasi Kontrak maksimal 7 (tujuh) hari kalender sejak dinyatakan diterima :',
        subItems: [
          'a. Curriculum Vitae',
          'b. Kartu Tanda Penduduk',
          'c. Kartu Keluarga',
          'd. Nomor Pokok Wajib Pajak',
          'e. Rekening Bank Rakyat Indonesia (Wajib sudah ada maksimal pada penggajian kedua)',
          'f. Surat Keterangan Sehat dari Puskesmas atau Bukti Vaksin',
          'g. SKCK Aktif (Wajib aktif selama bekerja)',
          'h. Ijazah pendidikan terakhir',
          'i. Transkrip Nilai',
          'j. Surat Domisili',
        ],
        checked: false,
      },
      {
        id: 'k2',
        text: 'Memberikan keterangan yang sejujurnya mengenai status, kondisi dan hal apapun tentang diri saya selama bekerja.',
        checked: false,
      },
      {
        id: 'k3',
        text: 'Bersedia melakukan training di daerah sesuai dengan permintaan client (apabila ada).',
        checked: false,
      },
      {
        id: 'k4',
        text: 'Tidak melakukan kekerasan, kecurangan, penipuan dan/atau pemalsuan dalam bentuk apapun selama bekerja, Tidak menerima pekerjaan dan/atau bekerja secara bersamaan dengan Pihak lain dan/atau Perusahaan lain baik secara langsung maupun tidak langsung.',
        checked: false,
      },
      {
        id: 'k5',
        text: 'Tidak melakukan pinjam meminjam uang ke sesama karyawan dan/atau pihak ketiga.',
        checked: false,
      },
      {
        id: 'k6',
        text: 'Tidak bertukar dan menjaga informasi yang bersifat Kerahasiaan Data baik milik Pribadi ataupun Perusahaan dengan siapapun.',
        checked: false,
      },
      {
        id: 'k7',
        text: 'Paklaring akan diberikan minimal 1 bulan dari tanggal terakhir bekerja dan/atau sudah :',
        subItems: [
          'a. Menyelesaikan kelengkapan administrasi yang sudah disetujui atasan',
          'b. Mengembalikan Asset Inventarisasi maksimal H-7 pembayaran gaji',
          'c. Memberikan absensi terakhir yang sudah disetujui atasan',
        ],
        checked: false,
      },
      {
        id: 'k8',
        text: 'Prosedur Resign diwajibkan mengajukan pemberitahuan secara tertulis 30 (tiga puluh) hari sebelum tanggal efektif pengunduran diri, menyelesaikan exit clearence, dan mengembalikan perlengkapan dan peralatan kerja serta barang-barang milik Perusahaan.',
        checked: false,
      },
      {
        id: 'k9',
        text: 'Slip Gaji akan dikirim maksimal 14 hari kerja dari tanggal penerimaan gaji.',
        checked: false,
      },
      {
        id: 'k10',
        text: 'Mentaati setiap prosedur dan peraturan tertulis mapun tidak tertulis yang ada di Perusahaan.',
        checked: false,
      },
      {
        id: 'k11',
        text: 'Selalu berkomitmen menjaga nama baik Perusahaan, Client, dan/atau Pihak lainnya.',
        checked: false,
      },
      {
        id: 'k12',
        text: 'Membebaskan Perusahaan dari segala kerugian dan tuntutan apapun terhadap pelanggaran yang dilakukan oleh karyawan.',
        checked: false,
      },
    ],
    sanksi: [
      {
        id: 's1',
        text: 'Mengembalikan dan memberikan ganti rugi terhadap seluruh pembayaran yang telah diberikan Perusahaan kepada saya (apabila ada).',
        checked: false,
      },
      {
        id: 's2',
        text: 'Perusahaan berhak tidak membayarkan apapun apabila karyawan melanggar Perjanjian Kerja, Peraturan Perusahaan, dan Peraturan lainnya.',
        checked: false,
      },
      {
        id: 's3',
        text: 'Hak Karyawan akan dibayarkan saat keseluruhan dokumen Administrasi Kontrak Kerja dilengkapi oleh Karyawan dan dinyatakan lengkap.',
        checked: false,
      },
      {
        id: 's4',
        text: 'Jika karyawan resign tidak sesuai prosedur dan/atau diberhentikan karena pelanggaran penipuan, pemalsuan, pencurian, double job, tindakan perdata ataupun pidana dan/atau lainnya yang diatur lebih lanjut dalam Perjanjian Kerja, Peraturan Perusahaan, dan Peraturan lainnya, maka paklaring dan sisa haknya dalam bentuk apapun tidak dapat diberikan.',
        checked: false,
      },
      {
        id: 's5',
        text: 'Jika karyawan belum mengembalikan asset inventarisasi sesuai waktu yang sudah ditentukan, maka sisa haknya belum dapat dibayarkan dan/atau akan dibayarkan pada penggajian periode selanjutnya.',
        checked: false,
      },
      {
        id: 's6',
        text: 'Sanksi atas pelangaran-pelanggaran lebih lanjut dimuat dalam Perjanjian Kerja, Peraturan Perusahaan, dan Peraturan lainnya.',
        checked: false,
      },
    ],
    finalDeclaration: {
      text: 'Dengan menyetujui ini, saya menyatakan telah menerima seluruh informasi dan/atau penjelasan, dan saya mengerti, memahami dan berjanji akan mentaati seluruh peraturan milik Perusahaan. Pernyataan ini saya nyatakan dengan secara sadar, sehat, dan tanpa paksaan dari pihak manapun. Surat On Boarding ini telah saya setujui, maka saya tidak akan melakukan tuntutan dalam hal apapun dikemudian hari.',
      checked: false,
    },
  };
}
