#!/usr/bin/env perl

use v5.10;

use autodie;
use strict;
use warnings;

use Getopt::Long;
use JSON ();
use Path::Class;
use URI;

use constant USAGE => <<EOT;
Syntax: $0 days.json default.json image_dir output.json image_output
EOT

my %LINKS = ( 'Research and Education Space' => 'http://res.space/' );

GetOptions() or die USAGE;
@ARGV == 5   or die USAGE;

my ( $days_file, $default_file, $images_dir, $output_file,
  $output_images ) = @ARGV;

my $days = load_json($days_file);
my $default = -f $default_file ? load_json($default_file) : [];

my %image = map { lc $_->basename => $_ } dir($images_dir)->children;

my @output = ();
for my $dn ( 0 .. $#$days ) {
  my $day = $days->[$dn];
  my $date = $dn + 1;
  my $rec = {};
  $rec->{title}     = $day->{title};
  $rec->{synopsis}  = fix_links( $day->{synopsis}, \%LINKS );
  $rec->{url}       = $day->{url};
  $rec->{image_url} = "/i/day${date}.jpg";
  push @output, $rec;
}

save_json( $default_file, $default );
save_json( $output_file,  \@output );

sub find_image {
  my $dn = shift;
  return $default->[$dn]{image_url}
   if exists $default->[$dn]{image_url};

  my $image_url = $days->[$dn]{image_url};
  return if $image_url =~ /^\s*$/;
  ( my $base = $image_url ) =~ s!^.*?([^/]+$)!$1!;
  return;
}

sub fix_links {
  my $text = shift;
  return $text;
}

sub save_json {
  my ( $file, $json ) = @_;
  my $fh = file($file)->openw;
  $fh->binmode(":utf8");
  $fh->print( JSON->new->pretty->canonical->encode($json) );
}

sub load_json {
  my $file = shift;
  my $fh   = file($file)->openr;
  $fh->binmode(":utf8");
  return JSON->new->decode(
    do { local $/; <$fh> }
  );
}

# vim:ts=2:sw=2:sts=2:et:ft=perl
